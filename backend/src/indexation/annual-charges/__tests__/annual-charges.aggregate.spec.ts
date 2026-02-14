jest.mock('nestjs-cqrx', () => {
  const { mockCqrx } = require('./mock-cqrx');
  return mockCqrx;
});

import { AnnualChargesAggregate } from '../annual-charges.aggregate';
import { AnnualChargesRecorded } from '../events/annual-charges-recorded.event';

describe('AnnualChargesAggregate', () => {
  const validCharges = [
    { category: 'water', label: 'Eau', amountCents: 45000 },
    { category: 'electricity', label: 'Électricité', amountCents: 30000 },
    { category: 'teom', label: 'TEOM', amountCents: 25000 },
    { category: 'cleaning', label: 'Nettoyage', amountCents: 20000 },
  ];

  describe('record', () => {
    it('should emit AnnualChargesRecorded event with valid data', () => {
      const aggregate = new AnnualChargesAggregate('entity1-2025');
      aggregate.record('entity-1', 'user-1', 2025, validCharges);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AnnualChargesRecorded);

      const event = events[0] as AnnualChargesRecorded;
      expect(event.data.annualChargesId).toBe('entity1-2025');
      expect(event.data.entityId).toBe('entity-1');
      expect(event.data.userId).toBe('user-1');
      expect(event.data.fiscalYear).toBe(2025);
      expect(event.data.charges).toHaveLength(4);
      expect(event.data.totalAmountCents).toBe(120000);
      expect(event.data.recordedAt).toBeDefined();
    });

    it('should calculate total from all charge entries', () => {
      const aggregate = new AnnualChargesAggregate('test-id');
      const charges = [
        { category: 'water', label: 'Eau', amountCents: 10000 },
        { category: 'custom', label: 'Gardiennage', amountCents: 5000 },
      ];
      aggregate.record('entity-1', 'user-1', 2025, charges);

      const event = aggregate.getUncommittedEvents()[0] as AnnualChargesRecorded;
      expect(event.data.totalAmountCents).toBe(15000);
    });

    it('should allow overwrite with different charges (emits new event)', () => {
      const aggregate = new AnnualChargesAggregate('test-id');
      aggregate.record('entity-1', 'user-1', 2025, validCharges);
      aggregate.commit();

      const updatedCharges = [
        { category: 'water', label: 'Eau', amountCents: 50000 },
      ];
      aggregate.record('entity-1', 'user-1', 2025, updatedCharges);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      const event = events[0] as AnnualChargesRecorded;
      expect(event.data.charges).toHaveLength(1);
      expect(event.data.totalAmountCents).toBe(50000);
    });

    it('should be no-op when recording identical data', () => {
      const aggregate = new AnnualChargesAggregate('test-id');
      aggregate.record('entity-1', 'user-1', 2025, validCharges);
      aggregate.commit();

      aggregate.record('entity-1', 'user-1', 2025, validCharges);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });

    it('should throw for invalid charge category', () => {
      const aggregate = new AnnualChargesAggregate('test-id');
      const charges = [{ category: 'gas', label: 'Gaz', amountCents: 5000 }];
      expect(() =>
        aggregate.record('entity-1', 'user-1', 2025, charges),
      ).toThrow('Invalid charge category');
    });

    it('should throw for invalid fiscal year', () => {
      const aggregate = new AnnualChargesAggregate('test-id');
      expect(() =>
        aggregate.record('entity-1', 'user-1', 1999, validCharges),
      ).toThrow('Invalid fiscal year');
    });

    it('should throw for empty label', () => {
      const aggregate = new AnnualChargesAggregate('test-id');
      const charges = [{ category: 'water', label: '', amountCents: 5000 }];
      expect(() =>
        aggregate.record('entity-1', 'user-1', 2025, charges),
      ).toThrow('Charge label cannot be empty');
    });

    it('should throw for negative amount', () => {
      const aggregate = new AnnualChargesAggregate('test-id');
      const charges = [{ category: 'water', label: 'Eau', amountCents: -100 }];
      expect(() =>
        aggregate.record('entity-1', 'user-1', 2025, charges),
      ).toThrow('non-negative');
    });

    it('should accept custom categories with labels', () => {
      const aggregate = new AnnualChargesAggregate('test-id');
      const charges = [
        { category: 'custom', label: 'Gardiennage', amountCents: 15000 },
        { category: 'custom', label: 'Ascenseur', amountCents: 8000 },
      ];
      aggregate.record('entity-1', 'user-1', 2025, charges);

      const event = aggregate.getUncommittedEvents()[0] as AnnualChargesRecorded;
      expect(event.data.charges).toHaveLength(2);
      expect(event.data.charges[0].label).toBe('Gardiennage');
      expect(event.data.charges[1].label).toBe('Ascenseur');
    });
  });

  describe('streamName', () => {
    it('should use annual-charges as stream name', () => {
      expect(AnnualChargesAggregate.streamName).toBe('annual-charges');
    });
  });
});
