jest.mock('nestjs-cqrx', () => {
  const { mockCqrx } = require('./mock-cqrx');
  return mockCqrx;
});

import { WaterMeterReadingsAggregate } from '../water-meter-readings.aggregate';
import { WaterMeterReadingsEntered } from '../events/water-meter-readings-entered.event';

describe('WaterMeterReadingsAggregate', () => {
  const validReadings = [
    { unitId: 'unit-a', previousReading: 100, currentReading: 150, readingDate: '2025-12-15T00:00:00.000Z' },
    { unitId: 'unit-b', previousReading: 200, currentReading: 280, readingDate: '2025-12-15T00:00:00.000Z' },
    { unitId: 'unit-c', previousReading: 150, currentReading: 180, readingDate: '2025-12-15T00:00:00.000Z' },
  ];

  describe('record', () => {
    it('should emit WaterMeterReadingsEntered event with valid data', () => {
      const aggregate = new WaterMeterReadingsAggregate('entity1-2025');
      aggregate.record('entity-1', 'user-1', 2025, validReadings);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(WaterMeterReadingsEntered);

      const event = events[0] as WaterMeterReadingsEntered;
      expect(event.data.waterMeterReadingsId).toBe('entity1-2025');
      expect(event.data.entityId).toBe('entity-1');
      expect(event.data.userId).toBe('user-1');
      expect(event.data.fiscalYear).toBe(2025);
      expect(event.data.readings).toHaveLength(3);
      // Consumption: (150-100) + (280-200) + (180-150) = 50 + 80 + 30 = 160
      expect(event.data.totalConsumption).toBe(160);
      expect(event.data.recordedAt).toBeDefined();
    });

    it('should be no-op when recording identical data', () => {
      const aggregate = new WaterMeterReadingsAggregate('test-id');
      aggregate.record('entity-1', 'user-1', 2025, validReadings);
      aggregate.commit();

      aggregate.record('entity-1', 'user-1', 2025, validReadings);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(0);
    });

    it('should emit event when data changes (overwrite)', () => {
      const aggregate = new WaterMeterReadingsAggregate('test-id');
      aggregate.record('entity-1', 'user-1', 2025, validReadings);
      aggregate.commit();

      const updatedReadings = [
        { unitId: 'unit-a', previousReading: 100, currentReading: 200, readingDate: '2025-12-20T00:00:00.000Z' },
        { unitId: 'unit-b', previousReading: 200, currentReading: 300, readingDate: '2025-12-20T00:00:00.000Z' },
        { unitId: 'unit-c', previousReading: 150, currentReading: 200, readingDate: '2025-12-20T00:00:00.000Z' },
      ];
      aggregate.record('entity-1', 'user-1', 2025, updatedReadings);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      const event = events[0] as WaterMeterReadingsEntered;
      // (200-100) + (300-200) + (200-150) = 100 + 100 + 50 = 250
      expect(event.data.totalConsumption).toBe(250);
    });

    it('should throw for invalid fiscal year', () => {
      const aggregate = new WaterMeterReadingsAggregate('test-id');
      expect(() =>
        aggregate.record('entity-1', 'user-1', 1999, validReadings),
      ).toThrow('Invalid fiscal year');
    });

    it('should throw for invalid reading (currentReading < previousReading)', () => {
      const aggregate = new WaterMeterReadingsAggregate('test-id');
      const invalidReadings = [
        { unitId: 'unit-a', previousReading: 200, currentReading: 100, readingDate: '2025-12-15T00:00:00.000Z' },
      ];
      expect(() =>
        aggregate.record('entity-1', 'user-1', 2025, invalidReadings),
      ).toThrow('must be >= previous reading');
    });
  });

  describe('streamName', () => {
    it('should use water-meter-readings as stream name', () => {
      expect(WaterMeterReadingsAggregate.streamName).toBe('water-meter-readings');
    });
  });
});
