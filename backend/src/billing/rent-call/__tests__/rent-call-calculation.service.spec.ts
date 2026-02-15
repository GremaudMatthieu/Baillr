import {
  RentCallCalculationService,
  type ActiveLeaseData,
} from '../rent-call-calculation.service';
import { RentCallMonth } from '../rent-call-month';

describe('RentCallCalculationService', () => {
  const service = new RentCallCalculationService();

  function makeLease(overrides: Partial<ActiveLeaseData> = {}): ActiveLeaseData {
    return {
      leaseId: 'lease-1',
      tenantId: 'tenant-1',
      unitId: 'unit-1',
      rentAmountCents: 80000,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: null,
      billingLines: [],
      ...overrides,
    };
  }

  describe('full month (no pro-rata)', () => {
    it('should return original amounts for full-month lease', () => {
      const month = RentCallMonth.fromString('2026-03');
      const results = service.calculateForMonth([makeLease()], month);

      expect(results).toHaveLength(1);
      expect(results[0].rentAmountCents).toBe(80000);
      expect(results[0].totalAmountCents).toBe(80000);
      expect(results[0].isProRata).toBe(false);
      expect(results[0].occupiedDays).toBe(31);
      expect(results[0].totalDaysInMonth).toBe(31);
    });

    it('should include billing lines in total', () => {
      const month = RentCallMonth.fromString('2026-03');
      const lease = makeLease({
        billingLines: [
          { chargeCategoryId: 'cat-water', categoryLabel: 'Eau', amountCents: 5000 },
          { chargeCategoryId: 'cat-parking', categoryLabel: 'Parking', amountCents: 3000 },
        ],
      });
      const results = service.calculateForMonth([lease], month);

      expect(results[0].rentAmountCents).toBe(80000);
      expect(results[0].billingLines).toHaveLength(2);
      expect(results[0].billingLines[0].amountCents).toBe(5000);
      expect(results[0].billingLines[1].amountCents).toBe(3000);
      expect(results[0].totalAmountCents).toBe(88000);
    });
  });

  describe('start mid-month (pro-rata)', () => {
    it('should pro-rata rent for lease starting mid-month', () => {
      const month = RentCallMonth.fromString('2026-03');
      const lease = makeLease({
        startDate: '2026-03-16T00:00:00.000Z',
      });
      const results = service.calculateForMonth([lease], month);

      expect(results).toHaveLength(1);
      expect(results[0].isProRata).toBe(true);
      expect(results[0].occupiedDays).toBe(16); // March 16-31 = 16 days
      expect(results[0].totalDaysInMonth).toBe(31);
      // Math.floor((16 * 80000) / 31) = Math.floor(41290.32...) = 41290
      expect(results[0].rentAmountCents).toBe(41290);
    });

    it('should pro-rata each billing line independently', () => {
      const month = RentCallMonth.fromString('2026-03');
      const lease = makeLease({
        startDate: '2026-03-16T00:00:00.000Z',
        billingLines: [{ chargeCategoryId: 'cat-water', categoryLabel: 'Eau', amountCents: 10000 }],
      });
      const results = service.calculateForMonth([lease], month);

      // Rent: Math.floor((16 * 80000) / 31) = 41290
      expect(results[0].rentAmountCents).toBe(41290);
      // Billing: Math.floor((16 * 10000) / 31) = Math.floor(5161.29...) = 5161
      expect(results[0].billingLines[0].amountCents).toBe(5161);
      // Total = 41290 + 5161 = 46451
      expect(results[0].totalAmountCents).toBe(46451);
    });
  });

  describe('end mid-month (pro-rata)', () => {
    it('should pro-rata rent for lease ending mid-month', () => {
      const month = RentCallMonth.fromString('2026-03');
      const lease = makeLease({
        endDate: '2026-03-15T00:00:00.000Z',
      });
      const results = service.calculateForMonth([lease], month);

      expect(results).toHaveLength(1);
      expect(results[0].isProRata).toBe(true);
      expect(results[0].occupiedDays).toBe(15); // March 1-15 = 15 days
      // Math.floor((15 * 80000) / 31) = Math.floor(38709.67...) = 38709
      expect(results[0].rentAmountCents).toBe(38709);
    });
  });

  describe('start and end in same month', () => {
    it('should pro-rata for lease starting and ending in same month', () => {
      const month = RentCallMonth.fromString('2026-03');
      const lease = makeLease({
        startDate: '2026-03-10T00:00:00.000Z',
        endDate: '2026-03-20T00:00:00.000Z',
      });
      const results = service.calculateForMonth([lease], month);

      expect(results).toHaveLength(1);
      expect(results[0].isProRata).toBe(true);
      expect(results[0].occupiedDays).toBe(11); // March 10-20 = 11 days
      // Math.floor((11 * 80000) / 31) = Math.floor(28387.09...) = 28387
      expect(results[0].rentAmountCents).toBe(28387);
    });
  });

  describe('no active leases', () => {
    it('should return empty array for empty lease list', () => {
      const month = RentCallMonth.fromString('2026-03');
      const results = service.calculateForMonth([], month);
      expect(results).toHaveLength(0);
    });
  });

  describe('terminated before month', () => {
    it('should skip lease terminated before the target month', () => {
      const month = RentCallMonth.fromString('2026-03');
      const lease = makeLease({
        endDate: '2026-02-15T00:00:00.000Z',
      });
      const results = service.calculateForMonth([lease], month);
      expect(results).toHaveLength(0);
    });
  });

  describe('multiple billing lines with pro-rata', () => {
    it('should apply pro-rata to each billing line independently', () => {
      const month = RentCallMonth.fromString('2026-04'); // 30 days
      const lease = makeLease({
        startDate: '2026-04-11T00:00:00.000Z',
        billingLines: [
          { chargeCategoryId: 'cat-elec', categoryLabel: 'Électricité', amountCents: 6000 },
          { chargeCategoryId: 'cat-parking', categoryLabel: 'Parking', amountCents: 3000 },
        ],
      });
      const results = service.calculateForMonth([lease], month);

      expect(results[0].occupiedDays).toBe(20); // April 11-30 = 20 days
      expect(results[0].totalDaysInMonth).toBe(30);
      // Rent: Math.floor((20 * 80000) / 30) = Math.floor(53333.33) = 53333
      expect(results[0].rentAmountCents).toBe(53333);
      // Provisions: Math.floor((20 * 6000) / 30) = Math.floor(4000) = 4000
      expect(results[0].billingLines[0].amountCents).toBe(4000);
      // Garage: Math.floor((20 * 3000) / 30) = Math.floor(2000) = 2000
      expect(results[0].billingLines[1].amountCents).toBe(2000);
      // Total: 53333 + 4000 + 2000 = 59333
      expect(results[0].totalAmountCents).toBe(59333);
    });
  });

  describe('leap year February', () => {
    it('should use 29 days for February in a leap year', () => {
      const month = RentCallMonth.fromString('2028-02'); // 2028 is a leap year
      const lease = makeLease({
        startDate: '2028-02-15T00:00:00.000Z',
      });
      const results = service.calculateForMonth([lease], month);

      expect(results[0].totalDaysInMonth).toBe(29);
      expect(results[0].occupiedDays).toBe(15); // Feb 15-29 = 15 days
      // Math.floor((15 * 80000) / 29) = Math.floor(41379.31...) = 41379
      expect(results[0].rentAmountCents).toBe(41379);
    });

    it('should use 28 days for February in a non-leap year', () => {
      const month = RentCallMonth.fromString('2026-02');
      const results = service.calculateForMonth([makeLease()], month);
      expect(results[0].totalDaysInMonth).toBe(28);
      expect(results[0].occupiedDays).toBe(28);
      expect(results[0].isProRata).toBe(false);
    });
  });

  describe('multiple leases', () => {
    it('should calculate for multiple leases', () => {
      const month = RentCallMonth.fromString('2026-03');
      const leases = [
        makeLease({ leaseId: 'lease-1', rentAmountCents: 80000 }),
        makeLease({ leaseId: 'lease-2', rentAmountCents: 60000 }),
      ];
      const results = service.calculateForMonth(leases, month);

      expect(results).toHaveLength(2);
      expect(results[0].leaseId).toBe('lease-1');
      expect(results[0].totalAmountCents).toBe(80000);
      expect(results[1].leaseId).toBe('lease-2');
      expect(results[1].totalAmountCents).toBe(60000);
    });
  });
});
