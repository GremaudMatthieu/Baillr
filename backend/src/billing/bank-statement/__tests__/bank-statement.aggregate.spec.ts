import { mockCqrx } from './mock-cqrx';

jest.mock('nestjs-cqrx', () => mockCqrx);

import { BankStatementAggregate } from '../bank-statement.aggregate';
import { BankStatementImported } from '../events/bank-statement-imported.event';

describe('BankStatementAggregate', () => {
  const transactions = [
    {
      date: '2026-01-15T00:00:00.000Z',
      amountCents: 80000,
      payerName: 'DUPONT JEAN',
      reference: 'VIR-001',
    },
    {
      date: '2026-01-16T00:00:00.000Z',
      amountCents: -50000,
      payerName: 'EDF',
      reference: 'PRLV-002',
    },
  ];

  it('should emit BankStatementImported event on import', () => {
    const aggregate = new BankStatementAggregate('bs-123');

    aggregate.import(
      'entity-1',
      'user_abc',
      'ba-1',
      'releve-janvier.csv',
      transactions,
      new Date('2026-01-20T10:00:00.000Z'),
    );

    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(BankStatementImported);
  });

  it('should set all fields from BankStatementImported event', () => {
    const aggregate = new BankStatementAggregate('bs-456');

    aggregate.import(
      'entity-2',
      'user_xyz',
      'ba-2',
      'releve.xlsx',
      transactions,
      new Date('2026-02-01T12:00:00.000Z'),
    );

    const events = aggregate.getUncommittedEvents();
    const event = events[0] as BankStatementImported;

    expect(event.data.bankStatementId).toBe('bs-456');
    expect(event.data.entityId).toBe('entity-2');
    expect(event.data.userId).toBe('user_xyz');
    expect(event.data.bankAccountId).toBe('ba-2');
    expect(event.data.fileName).toBe('releve.xlsx');
    expect(event.data.transactionCount).toBe(2);
    expect(event.data.transactions).toHaveLength(2);
    expect(event.data.importedAt).toBe('2026-02-01T12:00:00.000Z');
  });

  it('should no-op on duplicate import (replay guard)', () => {
    const aggregate = new BankStatementAggregate('bs-789');

    aggregate.import(
      'entity-1',
      'user_abc',
      'ba-1',
      'releve.csv',
      transactions,
      new Date(),
    );

    // Second import should be a no-op
    aggregate.import(
      'entity-1',
      'user_abc',
      'ba-1',
      'releve2.csv',
      transactions,
      new Date(),
    );

    const events = aggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
  });
});
