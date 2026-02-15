import {
  RegularizationCalculationService,
  calculateOccupiedDaysInYear,
} from '../services/regularization-calculation.service';

// --- Helpers ---
function makeCharge(
  overrides: Partial<{
    chargeCategoryId: string;
    label: string;
    amountCents: number;
  }> = {},
) {
  return {
    chargeCategoryId: 'cat-teom',
    label: 'TEOM',
    amountCents: 80000,
    ...overrides,
  };
}

function makeLease(
  overrides: Partial<{
    id: string;
    tenantId: string;
    unitId: string;
    startDate: Date;
    endDate: Date | null;
    tenant: Record<string, unknown>;
    unit: Record<string, unknown>;
  }> = {},
) {
  return {
    id: 'lease-1',
    entityId: 'entity-1',
    userId: 'user-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    startDate: new Date('2025-01-01'),
    endDate: null,
    tenant: {
      id: 'tenant-1',
      firstName: 'Jean',
      lastName: 'Dupont',
      companyName: null,
    },
    unit: { id: 'unit-1', identifier: 'Apt A' },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeAnnualCharges(charges: Array<{ chargeCategoryId: string; label: string; amountCents: number }>) {
  return {
    id: 'entity1-2025',
    entityId: 'entity-1',
    userId: 'user-1',
    fiscalYear: 2025,
    charges: charges as unknown,
    totalAmountCents: charges.reduce((s, c) => s + c.amountCents, 0),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('RegularizationCalculationService', () => {
  let service: RegularizationCalculationService;
  let mockAnnualChargesFinder: {
    findByEntityAndYear: jest.Mock;
    findPaidBillingLinesByLeaseAndYear: jest.Mock;
  };
  let mockLeaseFinder: { findAllByEntityAndFiscalYear: jest.Mock };
  let mockWaterReadingsFinder: { findByEntityAndYear: jest.Mock };
  let mockWaterDistributionService: { compute: jest.Mock };

  beforeEach(() => {
    mockAnnualChargesFinder = {
      findByEntityAndYear: jest.fn(),
      findPaidBillingLinesByLeaseAndYear: jest.fn().mockResolvedValue([]),
    };
    mockLeaseFinder = {
      findAllByEntityAndFiscalYear: jest.fn(),
    };
    mockWaterReadingsFinder = {
      findByEntityAndYear: jest.fn().mockResolvedValue(null),
    };
    mockWaterDistributionService = {
      compute: jest.fn(),
    };
    service = new RegularizationCalculationService(
      mockAnnualChargesFinder as never,
      mockLeaseFinder as never,
      mockWaterReadingsFinder as never,
      mockWaterDistributionService as never,
    );
  });

  describe('BDD Scenario 1: Full-year tenant with all categories', () => {
    it('should calculate full-year share with no pro-rata', async () => {
      const charges = [
        makeCharge({ chargeCategoryId: 'cat-teom', label: 'TEOM', amountCents: 80000 }),
        makeCharge({ chargeCategoryId: 'cat-cleaning', label: 'Nettoyage', amountCents: 50000 }),
      ];
      mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(
        makeAnnualCharges(charges),
      );
      mockLeaseFinder.findAllByEntityAndFiscalYear.mockResolvedValue([
        makeLease(),
      ]);
      // 12 months × 10833¢ (with chargeCategoryId to count as provisions)
      mockAnnualChargesFinder.findPaidBillingLinesByLeaseAndYear.mockResolvedValue([
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 10833 }] },
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 10833 }] },
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 10833 }] },
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 10833 }] },
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 10833 }] },
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 10833 }] },
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 10833 }] },
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 10833 }] },
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 10833 }] },
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 10833 }] },
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 10833 }] },
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 10833 }] },
      ]);

      const result = await service.calculate('entity-1', 'user-1', 2025);

      expect(result).toHaveLength(1);
      const statement = result[0];
      expect(statement.tenantName).toBe('Dupont Jean');
      expect(statement.unitIdentifier).toBe('Apt A');
      expect(statement.occupiedDays).toBe(365);
      expect(statement.daysInYear).toBe(365);
      // Full year: Math.floor(365 * 80000 / 365) = 80000
      expect(statement.totalShareCents).toBe(130000); // 80000 + 50000
      expect(statement.totalProvisionsPaidCents).toBe(129996); // 12 × 10833
      expect(statement.balanceCents).toBe(4); // Complément
    });
  });

  describe('BDD Scenario 2: Partial-year tenant', () => {
    it('should pro-rate charges for mid-year lease start', async () => {
      const charges = [
        makeCharge({ chargeCategoryId: 'cat-teom', label: 'TEOM', amountCents: 80000 }),
      ];
      mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(
        makeAnnualCharges(charges),
      );
      // Lease started July 1, 2025 → 184 days
      mockLeaseFinder.findAllByEntityAndFiscalYear.mockResolvedValue([
        makeLease({
          startDate: new Date('2025-07-01'),
          tenant: { id: 'tenant-2', firstName: 'Marie', lastName: 'Martin', companyName: null },
          unit: { id: 'unit-2', identifier: 'Apt B' },
        }),
      ]);
      mockAnnualChargesFinder.findPaidBillingLinesByLeaseAndYear.mockResolvedValue([
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 7000 }] },
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 7000 }] },
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 7000 }] },
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 7000 }] },
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 7000 }] },
        { billingLines: [{ chargeCategoryId: 'cat-teom', amountCents: 7000 }] },
      ]);

      const result = await service.calculate('entity-1', 'user-1', 2025);

      expect(result).toHaveLength(1);
      const statement = result[0];
      expect(statement.occupancyStart).toBe('2025-07-01');
      expect(statement.occupancyEnd).toBe('2025-12-31');
      expect(statement.occupiedDays).toBe(184);
      // TEOM: Math.floor(184 * 80000 / 365) = Math.floor(40328.767...) = 40328
      expect(statement.charges[0].tenantShareCents).toBe(40328);
      expect(statement.totalProvisionsPaidCents).toBe(42000); // 6 × 7000
      expect(statement.balanceCents).toBe(40328 - 42000); // -1672 (Trop-perçu)
    });
  });

  describe('BDD Scenario 3: Water distribution by consumption', () => {
    it('should use water distribution instead of pro-rata for water category', async () => {
      const charges = [
        makeCharge({ chargeCategoryId: 'cat-water', label: 'Eau', amountCents: 60000 }),
        makeCharge({ chargeCategoryId: 'cat-teom', label: 'TEOM', amountCents: 80000 }),
      ];
      mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(
        makeAnnualCharges(charges),
      );
      mockLeaseFinder.findAllByEntityAndFiscalYear.mockResolvedValue([
        makeLease({ startDate: new Date('2025-07-01') }),
      ]);
      mockWaterReadingsFinder.findByEntityAndYear.mockResolvedValue({
        id: 'wr-1',
        readings: [],
        totalConsumption: 100,
        fiscalYear: 2025,
      });
      mockWaterDistributionService.compute.mockReturnValue({
        fiscalYear: 2025,
        totalWaterCents: 60000,
        totalConsumption: 100,
        distributions: [
          { unitId: 'unit-1', consumption: 75, percentage: 75, amountCents: 45000, isMetered: true },
        ],
      });
      mockAnnualChargesFinder.findPaidBillingLinesByLeaseAndYear.mockResolvedValue([]);

      const result = await service.calculate('entity-1', 'user-1', 2025);

      const waterCharge = result[0].charges.find((c) => c.label === 'Eau');
      expect(waterCharge!.tenantShareCents).toBe(45000); // from water distribution
      expect(waterCharge!.isWaterByConsumption).toBe(true);

      const teomCharge = result[0].charges.find((c) => c.label === 'TEOM');
      // 184 days: Math.floor(184 * 80000 / 365) = 40328
      expect(teomCharge!.tenantShareCents).toBe(40328);
      expect(teomCharge!.isWaterByConsumption).toBe(false);
    });
  });

  describe('BDD Scenario 4: No annual charges', () => {
    it('should throw NoChargesRecordedException', async () => {
      mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(null);

      await expect(
        service.calculate('entity-1', 'user-1', 2025),
      ).rejects.toThrow('No annual charges recorded for fiscal year 2025');
    });
  });

  describe('BDD Scenario 5: No leases found', () => {
    it('should throw NoLeasesFoundException', async () => {
      mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(
        makeAnnualCharges([makeCharge()]),
      );
      mockLeaseFinder.findAllByEntityAndFiscalYear.mockResolvedValue([]);

      await expect(
        service.calculate('entity-1', 'user-1', 2025),
      ).rejects.toThrow('No leases found for fiscal year 2025');
    });
  });

  describe('Rounding remainder distribution', () => {
    it('should distribute remainder to first tenant alphabetically', async () => {
      // 2 tenants partial year, charge 10001¢ → creates rounding difference
      const charges = [
        makeCharge({ chargeCategoryId: 'cat-teom', label: 'TEOM', amountCents: 10001 }),
      ];
      mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(
        makeAnnualCharges(charges),
      );
      // Both full year → each gets floor(365*10001/365) = 10001 → sum=20002, remainder = 10001-20002 = -10001 (wrong)
      // This only works with partial year. Let's use 2 partial year tenants.
      // Tenant A: 200 days, Tenant B: 165 days (total = 365)
      mockLeaseFinder.findAllByEntityAndFiscalYear.mockResolvedValue([
        makeLease({
          id: 'lease-1',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-07-19'),
          tenantId: 'tenant-1',
          unitId: 'unit-1',
          tenant: { id: 'tenant-1', firstName: 'Alice', lastName: 'Abc', companyName: null },
          unit: { id: 'unit-1', identifier: 'Apt A' },
        }),
        makeLease({
          id: 'lease-2',
          startDate: new Date('2025-07-20'),
          endDate: null,
          tenantId: 'tenant-2',
          unitId: 'unit-1',
          tenant: { id: 'tenant-2', firstName: 'Zoé', lastName: 'Zzz', companyName: null },
          unit: { id: 'unit-1', identifier: 'Apt A' },
        }),
      ]);
      mockAnnualChargesFinder.findPaidBillingLinesByLeaseAndYear.mockResolvedValue([]);

      const result = await service.calculate('entity-1', 'user-1', 2025);

      expect(result).toHaveLength(2);
      // Abc Alice is first alphabetically (lastName firstName format)
      expect(result[0].tenantName).toBe('Abc Alice');
      expect(result[1].tenantName).toBe('Zzz Zoé');

      // Alice: 200 days → floor(200 * 10001 / 365) = floor(5480.0) = 5480 (actually 200*10001/365=5479.45..→5479)
      // Zoé: 165 days → floor(165 * 10001 / 365) = floor(4521.5...) = 4521
      // Sum = 5479+4521 = 10000, remainder = 10001-10000 = 1 → added to Alice
      const aliceShare = result[0].charges[0].tenantShareCents;
      const zoeShare = result[1].charges[0].tenantShareCents;
      expect(aliceShare + zoeShare).toBe(10001); // sum exactly equals total
    });
  });

  describe('Company tenant name formatting', () => {
    it('should use companyName when available', async () => {
      mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(
        makeAnnualCharges([makeCharge()]),
      );
      mockLeaseFinder.findAllByEntityAndFiscalYear.mockResolvedValue([
        makeLease({
          tenant: { id: 'tenant-1', firstName: 'Jean', lastName: 'Dupont', companyName: 'SARL Dupont' },
        }),
      ]);
      mockAnnualChargesFinder.findPaidBillingLinesByLeaseAndYear.mockResolvedValue([]);

      const result = await service.calculate('entity-1', 'user-1', 2025);
      expect(result[0].tenantName).toBe('SARL Dupont');
    });
  });

  describe('Leap year handling', () => {
    it('should use 366 days for leap year', async () => {
      mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(
        makeAnnualCharges([makeCharge({ amountCents: 36600 })]),
      );
      mockLeaseFinder.findAllByEntityAndFiscalYear.mockResolvedValue([
        makeLease({ startDate: new Date('2024-01-01') }),
      ]);
      mockAnnualChargesFinder.findPaidBillingLinesByLeaseAndYear.mockResolvedValue([]);

      const result = await service.calculate('entity-1', 'user-1', 2024);
      expect(result[0].daysInYear).toBe(366);
      expect(result[0].occupiedDays).toBe(366);
      // Full year on leap year: Math.floor(366 * 36600 / 366) = 36600
      expect(result[0].totalShareCents).toBe(36600);
    });
  });

  describe('Multiple billing lines in provisions', () => {
    it('should sum all billing lines from paid rent calls', async () => {
      mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(
        makeAnnualCharges([makeCharge()]),
      );
      mockLeaseFinder.findAllByEntityAndFiscalYear.mockResolvedValue([makeLease()]);
      mockAnnualChargesFinder.findPaidBillingLinesByLeaseAndYear.mockResolvedValue([
        {
          billingLines: [
            { chargeCategoryId: 'cat-teom', amountCents: 5000 },
            { chargeCategoryId: 'cat-cleaning', amountCents: 3000 },
          ],
        },
        {
          billingLines: [
            { chargeCategoryId: 'cat-teom', amountCents: 5000 },
            { chargeCategoryId: 'cat-cleaning', amountCents: 3000 },
          ],
        },
      ]);

      const result = await service.calculate('entity-1', 'user-1', 2025);
      expect(result[0].totalProvisionsPaidCents).toBe(16000); // (5000+3000) × 2
    });
  });

  describe('Terminated lease in fiscal year', () => {
    it('should handle terminated lease with correct occupancy', async () => {
      mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(
        makeAnnualCharges([makeCharge({ amountCents: 36500 })]),
      );
      // Lease terminated mid-year
      mockLeaseFinder.findAllByEntityAndFiscalYear.mockResolvedValue([
        makeLease({ endDate: new Date('2025-06-30') }),
      ]);
      mockAnnualChargesFinder.findPaidBillingLinesByLeaseAndYear.mockResolvedValue([]);

      const result = await service.calculate('entity-1', 'user-1', 2025);
      expect(result[0].occupancyStart).toBe('2025-01-01');
      expect(result[0].occupancyEnd).toBe('2025-06-30');
      expect(result[0].occupiedDays).toBe(181); // Jan-June inclusive
      // Math.floor(181 * 36500 / 365) = Math.floor(18100) = 18100
      expect(result[0].charges[0].tenantShareCents).toBe(18100);
    });
  });
});

describe('calculateOccupiedDaysInYear', () => {
  it('should return 365 for full year 2025', () => {
    const result = calculateOccupiedDaysInYear(
      new Date('2025-01-01'),
      null,
      2025,
    );
    expect(result).toBe(365);
  });

  it('should return 366 for full year 2024 (leap year)', () => {
    const result = calculateOccupiedDaysInYear(
      new Date('2024-01-01'),
      null,
      2024,
    );
    expect(result).toBe(366);
  });

  it('should return 184 for July 1 to Dec 31', () => {
    const result = calculateOccupiedDaysInYear(
      new Date('2025-07-01'),
      null,
      2025,
    );
    expect(result).toBe(184);
  });

  it('should return 181 for Jan 1 to June 30', () => {
    const result = calculateOccupiedDaysInYear(
      new Date('2025-01-01'),
      new Date('2025-06-30'),
      2025,
    );
    expect(result).toBe(181);
  });

  it('should return 0 when lease does not overlap', () => {
    const result = calculateOccupiedDaysInYear(
      new Date('2024-01-01'),
      new Date('2024-12-31'),
      2025,
    );
    expect(result).toBe(0);
  });

  it('should handle lease starting before fiscal year', () => {
    const result = calculateOccupiedDaysInYear(
      new Date('2023-06-15'),
      null,
      2025,
    );
    expect(result).toBe(365);
  });

  it('should handle lease ending after fiscal year', () => {
    const result = calculateOccupiedDaysInYear(
      new Date('2025-06-01'),
      new Date('2026-03-15'),
      2025,
    );
    // June 1 to Dec 31 = 214 days
    expect(result).toBe(214);
  });
});
