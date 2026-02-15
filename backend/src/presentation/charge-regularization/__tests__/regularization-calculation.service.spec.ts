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

function makeBillingLine(
  overrides: Partial<{
    leaseId: string;
    chargeCategoryId: string;
    amountCents: number;
  }> = {},
) {
  return {
    leaseId: 'lease-1',
    chargeCategoryId: 'cat-teom',
    amountCents: 6667, // ~80000 / 12
    chargeCategory: {
      id: overrides.chargeCategoryId ?? 'cat-teom',
      label: 'TEOM',
      slug: 'teom',
      entityId: 'entity-1',
      isStandard: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    ...overrides,
  };
}

describe('RegularizationCalculationService', () => {
  let service: RegularizationCalculationService;
  let mockAnnualChargesFinder: {
    findByEntityAndYear: jest.Mock;
  };
  let mockLeaseFinder: {
    findAllByEntityAndFiscalYear: jest.Mock;
    findBillingLinesByLeaseIds: jest.Mock;
  };
  let mockWaterReadingsFinder: { findByEntityAndYear: jest.Mock };
  let mockWaterDistributionService: { compute: jest.Mock };

  beforeEach(() => {
    mockAnnualChargesFinder = {
      findByEntityAndYear: jest.fn(),
    };
    mockLeaseFinder = {
      findAllByEntityAndFiscalYear: jest.fn(),
      findBillingLinesByLeaseIds: jest.fn().mockResolvedValue([]),
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

  describe('Full-year tenant with provisions from billing lines', () => {
    it('should calculate provisions from lease billing lines × 12 months', async () => {
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
      // Billing lines: TEOM 6667¢/month, Cleaning 4167¢/month
      mockLeaseFinder.findBillingLinesByLeaseIds.mockResolvedValue([
        makeBillingLine({ leaseId: 'lease-1', chargeCategoryId: 'cat-teom', amountCents: 6667 }),
        makeBillingLine({ leaseId: 'lease-1', chargeCategoryId: 'cat-cleaning', amountCents: 4167 }),
      ]);

      const result = await service.calculate('entity-1', 'user-1', 2025);

      expect(result).toHaveLength(1);
      const statement = result[0];
      expect(statement.tenantName).toBe('Dupont Jean');
      expect(statement.occupiedDays).toBe(365);
      expect(statement.totalShareCents).toBe(130000); // 80000 + 50000
      // Provisions: TEOM 6667 × 12 = 80004, Cleaning 4167 × 12 = 50004
      expect(statement.totalProvisionsPaidCents).toBe(130008);
      expect(statement.balanceCents).toBe(130000 - 130008); // -8 (slight overpayment)

      // Per-category provisions
      const teomCharge = statement.charges.find((c) => c.label === 'TEOM');
      expect(teomCharge!.provisionsPaidCents).toBe(80004); // 6667 × 12
      const cleaningCharge = statement.charges.find((c) => c.label === 'Nettoyage');
      expect(cleaningCharge!.provisionsPaidCents).toBe(50004); // 4167 × 12
    });
  });

  describe('Partial-year tenant with pro-rata provisions', () => {
    it('should compute provisions × occupied months for mid-year lease', async () => {
      const charges = [
        makeCharge({ chargeCategoryId: 'cat-teom', label: 'TEOM', amountCents: 80000 }),
      ];
      mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(
        makeAnnualCharges(charges),
      );
      // Lease started July 1, 2025 → 184 days → ceil(184 / (365/12)) = ceil(6.04) = 7 months
      mockLeaseFinder.findAllByEntityAndFiscalYear.mockResolvedValue([
        makeLease({
          startDate: new Date('2025-07-01'),
          tenant: { id: 'tenant-2', firstName: 'Marie', lastName: 'Martin', companyName: null },
          unit: { id: 'unit-2', identifier: 'Apt B' },
        }),
      ]);
      mockLeaseFinder.findBillingLinesByLeaseIds.mockResolvedValue([
        makeBillingLine({ leaseId: 'lease-1', chargeCategoryId: 'cat-teom', amountCents: 7000 }),
      ]);

      const result = await service.calculate('entity-1', 'user-1', 2025);

      expect(result).toHaveLength(1);
      const statement = result[0];
      expect(statement.occupancyStart).toBe('2025-07-01');
      expect(statement.occupancyEnd).toBe('2025-12-31');
      expect(statement.occupiedDays).toBe(184);
      // TEOM share: Math.floor(184 * 80000 / 365) = 40328
      expect(statement.charges[0].tenantShareCents).toBe(40328);
      // Provisions: 7000 × ceil(184 / (365/12)) = 7000 × 7 = 49000
      const occupiedMonths = Math.ceil(184 / (365 / 12));
      expect(occupiedMonths).toBe(7);
      expect(statement.charges[0].provisionsPaidCents).toBe(49000);
      expect(statement.totalProvisionsPaidCents).toBe(49000);
      expect(statement.balanceCents).toBe(40328 - 49000); // -8672 (overpaid)
    });
  });

  describe('Multiple charge categories per lease', () => {
    it('should compute per-category provisions independently', async () => {
      const charges = [
        makeCharge({ chargeCategoryId: 'cat-teom', label: 'TEOM', amountCents: 36000 }),
        makeCharge({ chargeCategoryId: 'cat-cleaning', label: 'Nettoyage', amountCents: 12000 }),
        makeCharge({ chargeCategoryId: 'cat-elevator', label: 'Ascenseur', amountCents: 24000 }),
      ];
      mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(
        makeAnnualCharges(charges),
      );
      mockLeaseFinder.findAllByEntityAndFiscalYear.mockResolvedValue([makeLease()]);
      mockLeaseFinder.findBillingLinesByLeaseIds.mockResolvedValue([
        makeBillingLine({ leaseId: 'lease-1', chargeCategoryId: 'cat-teom', amountCents: 3000 }),
        makeBillingLine({ leaseId: 'lease-1', chargeCategoryId: 'cat-cleaning', amountCents: 1000 }),
        makeBillingLine({ leaseId: 'lease-1', chargeCategoryId: 'cat-elevator', amountCents: 2000 }),
      ]);

      const result = await service.calculate('entity-1', 'user-1', 2025);

      expect(result).toHaveLength(1);
      const s = result[0];
      // Full year = 12 months
      expect(s.charges[0].provisionsPaidCents).toBe(36000); // 3000 × 12
      expect(s.charges[1].provisionsPaidCents).toBe(12000); // 1000 × 12
      expect(s.charges[2].provisionsPaidCents).toBe(24000); // 2000 × 12
      expect(s.totalProvisionsPaidCents).toBe(72000);
      expect(s.totalShareCents).toBe(72000); // 36000 + 12000 + 24000
      expect(s.balanceCents).toBe(0); // exactly balanced
    });
  });

  describe('Lease with no billing lines', () => {
    it('should return 0 provisions when lease has no billing lines configured', async () => {
      const charges = [makeCharge({ amountCents: 50000 })];
      mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(
        makeAnnualCharges(charges),
      );
      mockLeaseFinder.findAllByEntityAndFiscalYear.mockResolvedValue([makeLease()]);
      mockLeaseFinder.findBillingLinesByLeaseIds.mockResolvedValue([]); // No billing lines

      const result = await service.calculate('entity-1', 'user-1', 2025);

      expect(result[0].totalProvisionsPaidCents).toBe(0);
      expect(result[0].charges[0].provisionsPaidCents).toBe(0);
      expect(result[0].balanceCents).toBe(50000); // tenant owes full amount
    });
  });

  describe('Water category excluded from billing-line provisions', () => {
    it('should NOT use billing-line provisions for water (uses meter readings instead)', async () => {
      const charges = [
        makeCharge({ chargeCategoryId: 'cat-water', label: 'Eau', amountCents: 60000 }),
        makeCharge({ chargeCategoryId: 'cat-teom', label: 'TEOM', amountCents: 36000 }),
      ];
      mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(
        makeAnnualCharges(charges),
      );
      mockLeaseFinder.findAllByEntityAndFiscalYear.mockResolvedValue([makeLease()]);
      // Even though billing lines exist for water category, they should be ignored
      mockLeaseFinder.findBillingLinesByLeaseIds.mockResolvedValue([
        makeBillingLine({ leaseId: 'lease-1', chargeCategoryId: 'cat-water', amountCents: 5000 }),
        makeBillingLine({ leaseId: 'lease-1', chargeCategoryId: 'cat-teom', amountCents: 3000 }),
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
          { unitId: 'unit-1', consumption: 100, percentage: 100, amountCents: 60000, isMetered: true },
        ],
      });

      const result = await service.calculate('entity-1', 'user-1', 2025);

      const waterCharge = result[0].charges.find((c) => c.label === 'Eau');
      expect(waterCharge!.tenantShareCents).toBe(60000);
      expect(waterCharge!.isWaterByConsumption).toBe(true);
      expect(waterCharge!.provisionsPaidCents).toBe(0); // Water provisions = 0 (meter-based)

      const teomCharge = result[0].charges.find((c) => c.label === 'TEOM');
      expect(teomCharge!.provisionsPaidCents).toBe(36000); // 3000 × 12
      expect(teomCharge!.isWaterByConsumption).toBe(false);
    });
  });

  describe('Water distribution by consumption (legacy test)', () => {
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
      mockLeaseFinder.findBillingLinesByLeaseIds.mockResolvedValue([]);
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

      const result = await service.calculate('entity-1', 'user-1', 2025);

      const waterCharge = result[0].charges.find((c) => c.label === 'Eau');
      expect(waterCharge!.tenantShareCents).toBe(45000);
      expect(waterCharge!.isWaterByConsumption).toBe(true);

      const teomCharge = result[0].charges.find((c) => c.label === 'TEOM');
      expect(teomCharge!.tenantShareCents).toBe(40328);
      expect(teomCharge!.isWaterByConsumption).toBe(false);
    });
  });

  describe('No annual charges', () => {
    it('should throw NoChargesRecordedException', async () => {
      mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(null);

      await expect(
        service.calculate('entity-1', 'user-1', 2025),
      ).rejects.toThrow('No annual charges recorded for fiscal year 2025');
    });
  });

  describe('No leases found', () => {
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
      const charges = [
        makeCharge({ chargeCategoryId: 'cat-teom', label: 'TEOM', amountCents: 10001 }),
      ];
      mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(
        makeAnnualCharges(charges),
      );
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
      mockLeaseFinder.findBillingLinesByLeaseIds.mockResolvedValue([]);

      const result = await service.calculate('entity-1', 'user-1', 2025);

      expect(result).toHaveLength(2);
      expect(result[0].tenantName).toBe('Abc Alice');
      expect(result[1].tenantName).toBe('Zzz Zoé');

      const aliceShare = result[0].charges[0].tenantShareCents;
      const zoeShare = result[1].charges[0].tenantShareCents;
      expect(aliceShare + zoeShare).toBe(10001);
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
      mockLeaseFinder.findBillingLinesByLeaseIds.mockResolvedValue([]);

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
      mockLeaseFinder.findBillingLinesByLeaseIds.mockResolvedValue([]);

      const result = await service.calculate('entity-1', 'user-1', 2024);
      expect(result[0].daysInYear).toBe(366);
      expect(result[0].occupiedDays).toBe(366);
      expect(result[0].totalShareCents).toBe(36600);
    });
  });

  describe('Terminated lease in fiscal year', () => {
    it('should handle terminated lease with correct occupancy', async () => {
      mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(
        makeAnnualCharges([makeCharge({ amountCents: 36500 })]),
      );
      mockLeaseFinder.findAllByEntityAndFiscalYear.mockResolvedValue([
        makeLease({ endDate: new Date('2025-06-30') }),
      ]);
      mockLeaseFinder.findBillingLinesByLeaseIds.mockResolvedValue([
        makeBillingLine({ leaseId: 'lease-1', chargeCategoryId: 'cat-teom', amountCents: 3000 }),
      ]);

      const result = await service.calculate('entity-1', 'user-1', 2025);
      expect(result[0].occupancyStart).toBe('2025-01-01');
      expect(result[0].occupancyEnd).toBe('2025-06-30');
      expect(result[0].occupiedDays).toBe(181);
      expect(result[0].charges[0].tenantShareCents).toBe(18100);
      // 181 days → ceil(181 / (365/12)) = ceil(5.95) = 6 months → 3000 × 6 = 18000
      expect(result[0].charges[0].provisionsPaidCents).toBe(18000);
      expect(result[0].balanceCents).toBe(18100 - 18000); // 100 (tenant owes)
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
    expect(result).toBe(214);
  });
});
