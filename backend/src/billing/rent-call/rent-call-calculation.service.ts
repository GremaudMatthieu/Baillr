import { Injectable } from '@nestjs/common';
import {
  calculateOccupiedDays,
  calculateProRataAmountCents,
  daysInMonth,
} from '@tenancy/lease/pro-rata.js';
import { RentCallMonth } from './rent-call-month.js';

export interface ActiveLeaseData {
  leaseId: string;
  tenantId: string;
  unitId: string;
  rentAmountCents: number;
  startDate: string;
  endDate: string | null;
  billingLines: Array<{ chargeCategoryId: string; categoryLabel: string; amountCents: number }>;
}

export interface RentCallCalculation {
  leaseId: string;
  tenantId: string;
  unitId: string;
  rentAmountCents: number;
  billingLines: Array<{ chargeCategoryId: string; categoryLabel: string; amountCents: number }>;
  totalAmountCents: number;
  isProRata: boolean;
  occupiedDays: number;
  totalDaysInMonth: number;
}

export interface IRentCallCalculationService {
  calculateForMonth(
    leases: ActiveLeaseData[],
    month: RentCallMonth,
  ): RentCallCalculation[];
}

@Injectable()
export class RentCallCalculationService implements IRentCallCalculationService {
  calculateForMonth(
    leases: ActiveLeaseData[],
    month: RentCallMonth,
  ): RentCallCalculation[] {
    const year = month.year;
    const m = month.month;
    const totalDays = daysInMonth(year, m);
    const monthStart = new Date(Date.UTC(year, m - 1, 1));

    const results: RentCallCalculation[] = [];

    for (const lease of leases) {
      // Filter out terminated leases that ended before this month
      if (lease.endDate !== null) {
        const endDate = new Date(lease.endDate);
        if (endDate < monthStart) {
          continue;
        }
      }

      const leaseStartDate = new Date(lease.startDate);
      const leaseEndDate = lease.endDate ? new Date(lease.endDate) : null;
      const occupied = calculateOccupiedDays(leaseStartDate, leaseEndDate, year, m);

      if (occupied === 0) {
        continue;
      }

      const isProRata = occupied !== totalDays;

      let rentAmountCents: number;
      let billingLines: Array<{ chargeCategoryId: string; categoryLabel: string; amountCents: number }>;

      if (isProRata) {
        rentAmountCents = calculateProRataAmountCents(
          lease.rentAmountCents,
          occupied,
          totalDays,
        );
        billingLines = lease.billingLines.map((line) => ({
          chargeCategoryId: line.chargeCategoryId,
          categoryLabel: line.categoryLabel,
          amountCents: calculateProRataAmountCents(
            line.amountCents,
            occupied,
            totalDays,
          ),
        }));
      } else {
        rentAmountCents = lease.rentAmountCents;
        billingLines = lease.billingLines.map((line) => ({
          chargeCategoryId: line.chargeCategoryId,
          categoryLabel: line.categoryLabel,
          amountCents: line.amountCents,
        }));
      }

      const totalAmountCents =
        rentAmountCents +
        billingLines.reduce((sum, line) => sum + line.amountCents, 0);

      results.push({
        leaseId: lease.leaseId,
        tenantId: lease.tenantId,
        unitId: lease.unitId,
        rentAmountCents,
        billingLines,
        totalAmountCents,
        isProRata,
        occupiedDays: occupied,
        totalDaysInMonth: totalDays,
      });
    }

    return results;
  }
}
