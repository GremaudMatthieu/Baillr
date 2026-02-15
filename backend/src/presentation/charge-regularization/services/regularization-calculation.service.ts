import { Injectable } from '@nestjs/common';
import type { Lease, Tenant, Unit, AnnualCharges } from '@prisma/client';
import type {
  StatementPrimitives,
  StatementChargePrimitives,
} from '@indexation/charge-regularization/regularization-statement.js';
import { AnnualChargesFinder } from '../../annual-charges/finders/annual-charges.finder.js';
import { LeaseFinder } from '../../lease/finders/lease.finder.js';
import { WaterMeterReadingsFinder } from '../../water-meter-readings/finders/water-meter-readings.finder.js';
import { WaterDistributionService } from '../../water-meter-readings/services/water-distribution.service.js';
import type { WaterDistributionResult } from '../../water-meter-readings/services/water-distribution.service.js';
import { NoChargesRecordedException } from '@indexation/charge-regularization/exceptions/no-charges-recorded.exception.js';
import { NoLeasesFoundException } from '@indexation/charge-regularization/exceptions/no-leases-found.exception.js';

interface ChargeEntry {
  chargeCategoryId: string;
  label: string;
  amountCents: number;
}

interface BillingLine {
  chargeCategoryId?: string | null;
  categoryLabel?: string;
  amountCents: number;
  label?: string;
  type?: string;
}

function isWaterCategory(charge: ChargeEntry): boolean {
  const label = charge.label.toLowerCase();
  return (
    label.includes('eau') ||
    charge.chargeCategoryId.toLowerCase().includes('water')
  );
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function calculateOccupiedDaysInYear(
  leaseStartDate: Date,
  leaseEndDate: Date | null,
  fiscalYear: number,
): number {
  const yearStart = new Date(Date.UTC(fiscalYear, 0, 1));
  const yearEnd = new Date(Date.UTC(fiscalYear, 11, 31));

  const startUtc = new Date(
    Date.UTC(
      leaseStartDate.getFullYear(),
      leaseStartDate.getMonth(),
      leaseStartDate.getDate(),
    ),
  );
  const endUtc = leaseEndDate
    ? new Date(
        Date.UTC(
          leaseEndDate.getFullYear(),
          leaseEndDate.getMonth(),
          leaseEndDate.getDate(),
        ),
      )
    : null;

  const effectiveStart = startUtc > yearStart ? startUtc : yearStart;
  const effectiveEnd = endUtc && endUtc < yearEnd ? endUtc : yearEnd;

  if (effectiveStart > effectiveEnd) return 0;

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((effectiveEnd.getTime() - effectiveStart.getTime()) / msPerDay) + 1;
}

function formatTenantName(tenant: Tenant): string {
  if (tenant.companyName) {
    return tenant.companyName;
  }
  return `${tenant.lastName} ${tenant.firstName}`.trim();
}

@Injectable()
export class RegularizationCalculationService {
  constructor(
    private readonly annualChargesFinder: AnnualChargesFinder,
    private readonly leaseFinder: LeaseFinder,
    private readonly waterReadingsFinder: WaterMeterReadingsFinder,
    private readonly waterDistributionService: WaterDistributionService,
  ) {}

  async calculate(
    entityId: string,
    userId: string,
    fiscalYear: number,
  ): Promise<StatementPrimitives[]> {
    // 1. Load annual charges
    const annualCharges = await this.annualChargesFinder.findByEntityAndYear(
      entityId,
      fiscalYear,
    );
    if (!annualCharges) {
      throw NoChargesRecordedException.forYear(fiscalYear);
    }

    const charges = annualCharges.charges as unknown as ChargeEntry[];

    // 2. Load leases overlapping fiscal year
    const leases = await this.leaseFinder.findAllByEntityAndFiscalYear(
      entityId,
      userId,
      fiscalYear,
    );
    if (leases.length === 0) {
      throw NoLeasesFoundException.forYear(fiscalYear);
    }

    // 3. Load water distribution (optional)
    const waterDistribution = await this.getWaterDistribution(
      entityId,
      fiscalYear,
      annualCharges,
      leases,
    );

    const daysInYear = isLeapYear(fiscalYear) ? 366 : 365;

    // 4. Calculate per-lease statements
    const statements: StatementPrimitives[] = [];
    const chargeShareTrackers = new Map<string, number>(); // categoryId → sum of all tenant shares

    for (const lease of leases) {
      const occupiedDays = calculateOccupiedDaysInYear(
        lease.startDate,
        lease.endDate,
        fiscalYear,
      );
      if (occupiedDays === 0) continue;

      const yearStart = new Date(Date.UTC(fiscalYear, 0, 1));
      const yearEnd = new Date(Date.UTC(fiscalYear, 11, 31));
      const startUtc = new Date(
        Date.UTC(
          lease.startDate.getFullYear(),
          lease.startDate.getMonth(),
          lease.startDate.getDate(),
        ),
      );
      const endUtc = lease.endDate
        ? new Date(
            Date.UTC(
              lease.endDate.getFullYear(),
              lease.endDate.getMonth(),
              lease.endDate.getDate(),
            ),
          )
        : null;
      const occupancyStart = startUtc > yearStart ? startUtc : yearStart;
      const occupancyEnd = endUtc && endUtc < yearEnd ? endUtc : yearEnd;

      // Calculate per-category shares
      const statementCharges: StatementChargePrimitives[] = [];
      for (const charge of charges) {
        let tenantShareCents: number;
        let isWaterByConsumptionFlag: boolean;

        if (isWaterCategory(charge) && waterDistribution) {
          const unitDist = waterDistribution.distributions.find(
            (d) => d.unitId === lease.unitId,
          );
          tenantShareCents = unitDist?.amountCents ?? 0;
          isWaterByConsumptionFlag = true;
        } else {
          tenantShareCents = Math.floor(
            (occupiedDays * charge.amountCents) / daysInYear,
          );
          isWaterByConsumptionFlag = false;
        }

        statementCharges.push({
          chargeCategoryId: charge.chargeCategoryId,
          label: charge.label,
          totalChargeCents: charge.amountCents,
          tenantShareCents,
          isWaterByConsumption: isWaterByConsumptionFlag,
        });

        // Track shares for remainder distribution
        const current = chargeShareTrackers.get(charge.chargeCategoryId) ?? 0;
        chargeShareTrackers.set(
          charge.chargeCategoryId,
          current + tenantShareCents,
        );
      }

      const totalShareCents = statementCharges.reduce(
        (sum, c) => sum + c.tenantShareCents,
        0,
      );

      // Calculate provisions paid for this lease
      const totalProvisionsPaidCents = await this.calculateProvisions(
        lease.id,
        fiscalYear,
      );

      const balanceCents = totalShareCents - totalProvisionsPaidCents;

      statements.push({
        leaseId: lease.id,
        tenantId: lease.tenantId,
        tenantName: formatTenantName(lease.tenant),
        unitId: lease.unitId,
        unitIdentifier: lease.unit.identifier,
        occupancyStart: occupancyStart.toISOString().split('T')[0],
        occupancyEnd: occupancyEnd.toISOString().split('T')[0],
        occupiedDays,
        daysInYear,
        charges: statementCharges,
        totalShareCents,
        totalProvisionsPaidCents,
        balanceCents,
      });
    }

    // 5. Sort by tenant name for deterministic remainder distribution
    statements.sort((a, b) => a.tenantName.localeCompare(b.tenantName));

    // 6. Distribute rounding remainder
    this.distributeRemainderToFirstTenant(statements, charges);

    return statements;
  }

  private distributeRemainderToFirstTenant(
    statements: StatementPrimitives[],
    charges: ChargeEntry[],
  ): void {
    if (statements.length === 0) return;

    for (const charge of charges) {
      // Skip water categories (already distributed by consumption)
      if (isWaterCategory(charge)) continue;

      const totalCharge = charge.amountCents;
      const sumShares = statements.reduce((sum, s) => {
        const sc = s.charges.find(
          (c) => c.chargeCategoryId === charge.chargeCategoryId,
        );
        return sum + (sc?.tenantShareCents ?? 0);
      }, 0);

      const remainder = totalCharge - sumShares;
      // Only distribute small rounding remainders (max N cents where N = number of tenants)
      // Large gaps are from partial occupancy and should NOT be distributed
      if (remainder !== 0 && Math.abs(remainder) <= statements.length) {
        const firstStatementCharge = statements[0].charges.find(
          (c) => c.chargeCategoryId === charge.chargeCategoryId,
        );
        if (firstStatementCharge) {
          firstStatementCharge.tenantShareCents += remainder;
          // Recalculate totals for first statement
          statements[0].totalShareCents = statements[0].charges.reduce(
            (sum, c) => sum + c.tenantShareCents,
            0,
          );
          statements[0].balanceCents =
            statements[0].totalShareCents -
            statements[0].totalProvisionsPaidCents;
        }
      }
    }
  }

  private async getWaterDistribution(
    entityId: string,
    fiscalYear: number,
    annualCharges: AnnualCharges,
    leases: (Lease & { tenant: Tenant; unit: Unit })[],
  ): Promise<WaterDistributionResult | null> {
    const charges = annualCharges.charges as unknown as ChargeEntry[];
    const waterCharge = charges.find((c) => isWaterCategory(c));
    if (!waterCharge) return null;

    const waterReadings = await this.waterReadingsFinder.findByEntityAndYear(
      entityId,
      fiscalYear,
    );

    if (!waterReadings) return null;

    const allUnitIds = [...new Set(leases.map((l) => l.unitId))];

    return this.waterDistributionService.compute(
      waterReadings,
      waterCharge.amountCents,
      allUnitIds,
    );
  }

  private async calculateProvisions(
    leaseId: string,
    fiscalYear: number,
  ): Promise<number> {
    const rentCalls =
      await this.annualChargesFinder.findPaidBillingLinesByLeaseAndYear(
        leaseId,
        fiscalYear,
      );

    let total = 0;
    for (const rc of rentCalls) {
      const lines = rc.billingLines as unknown as BillingLine[];
      if (!Array.isArray(lines)) continue;
      for (const line of lines) {
        if (line.chargeCategoryId) {
          total += line.amountCents;
        }
      }
    }
    return total;
  }
}
