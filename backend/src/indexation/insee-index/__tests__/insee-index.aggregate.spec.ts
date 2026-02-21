jest.mock('nestjs-cqrx', () => {
  const { mockCqrx } = require('./mock-cqrx');
  return mockCqrx;
});

import { InseeIndexAggregate } from '../insee-index.aggregate';
import { IndexRecorded } from '../events/index-recorded.event';

describe('InseeIndexAggregate', () => {
  describe('record', () => {
    it('should emit IndexRecorded event with valid data and default source "manual"', () => {
      const aggregate = new InseeIndexAggregate('test-id');
      aggregate.record('IRL', 'Q1', 2026, 142.06, 'entity-1', 'user-1');

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(IndexRecorded);

      const event = events[0] as IndexRecorded;
      expect(event.data.indexId).toBe('test-id');
      expect(event.data.type).toBe('IRL');
      expect(event.data.quarter).toBe('Q1');
      expect(event.data.year).toBe(2026);
      expect(event.data.value).toBe(142.06);
      expect(event.data.entityId).toBe('entity-1');
      expect(event.data.userId).toBe('user-1');
      expect(event.data.recordedAt).toBeDefined();
      expect(event.data.source).toBe('manual');
    });

    it('should emit IndexRecorded event with source "auto" when specified', () => {
      const aggregate = new InseeIndexAggregate('test-id');
      aggregate.record('IRL', 'Q1', 2026, 142.06, 'entity-1', 'user-1', 'auto');

      const events = aggregate.getUncommittedEvents();
      const event = events[0] as IndexRecorded;
      expect(event.data.source).toBe('auto');
    });

    it('should be a no-op if already recorded (replay guard)', () => {
      const aggregate = new InseeIndexAggregate('test-id');
      aggregate.record('IRL', 'Q1', 2026, 142.06, 'entity-1', 'user-1');
      aggregate.record('ILC', 'Q2', 2025, 130.5, 'entity-1', 'user-1');

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
    });

    it('should throw for invalid index type', () => {
      const aggregate = new InseeIndexAggregate('test-id');
      expect(() =>
        aggregate.record('INVALID', 'Q1', 2026, 142.06, 'entity-1', 'user-1'),
      ).toThrow('Invalid index type');
    });

    it('should throw for invalid quarter', () => {
      const aggregate = new InseeIndexAggregate('test-id');
      expect(() =>
        aggregate.record('IRL', 'Q5', 2026, 142.06, 'entity-1', 'user-1'),
      ).toThrow('Invalid index quarter');
    });

    it('should throw for invalid year', () => {
      const aggregate = new InseeIndexAggregate('test-id');
      expect(() =>
        aggregate.record('IRL', 'Q1', 1999, 142.06, 'entity-1', 'user-1'),
      ).toThrow('out of range');
    });

    it('should throw for invalid value (out of plausible range)', () => {
      const aggregate = new InseeIndexAggregate('test-id');
      expect(() =>
        aggregate.record('IRL', 'Q1', 2026, 14200, 'entity-1', 'user-1'),
      ).toThrow('outside plausible range');
    });

    it('should throw for negative value', () => {
      const aggregate = new InseeIndexAggregate('test-id');
      expect(() =>
        aggregate.record('IRL', 'Q1', 2026, -5, 'entity-1', 'user-1'),
      ).toThrow('must be positive');
    });
  });

  describe('streamName', () => {
    it('should use insee-index as stream name', () => {
      expect(InseeIndexAggregate.streamName).toBe('insee-index');
    });
  });
});
