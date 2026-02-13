import { mockCqrx } from './mock-cqrx';

jest.mock('nestjs-cqrx', () => mockCqrx);

import { ImportABankStatementHandler } from '../commands/import-a-bank-statement.handler';
import { ImportABankStatementCommand } from '../commands/import-a-bank-statement.command';
import { BankStatementImported } from '../events/bank-statement-imported.event';

describe('ImportABankStatementHandler', () => {
  let handler: ImportABankStatementHandler;
  let mockRepository: {
    save: jest.Mock;
  };

  const transactions = [
    {
      date: '2026-01-15T00:00:00.000Z',
      amountCents: 80000,
      payerName: 'DUPONT JEAN',
      reference: 'VIR-001',
      rawLine: { Date: '15/01/2026', Montant: '800,00' },
    },
  ];

  beforeEach(() => {
    mockRepository = {
      save: jest.fn().mockResolvedValue(undefined),
    };
    handler = new ImportABankStatementHandler(mockRepository as never);
  });

  it('should create aggregate and save on import', async () => {
    const command = new ImportABankStatementCommand(
      'bs-1',
      'entity-1',
      'user_abc',
      'ba-1',
      'releve.csv',
      transactions,
    );

    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should save aggregate with correct data', async () => {
    const command = new ImportABankStatementCommand(
      'bs-2',
      'entity-2',
      'user_xyz',
      'ba-2',
      'releve.xlsx',
      transactions,
    );

    await handler.execute(command);

    const savedAggregate = mockRepository.save.mock.calls[0][0];
    const events = savedAggregate.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(BankStatementImported);
    expect(events[0].data.entityId).toBe('entity-2');
    expect(events[0].data.bankAccountId).toBe('ba-2');
    expect(events[0].data.transactionCount).toBe(1);
  });

  it('should emit event with transaction data', async () => {
    const command = new ImportABankStatementCommand(
      'bs-3',
      'entity-1',
      'user_abc',
      'ba-1',
      'releve.csv',
      transactions,
    );

    await handler.execute(command);

    const savedAggregate = mockRepository.save.mock.calls[0][0];
    const events = savedAggregate.getUncommittedEvents();
    const event = events[0] as BankStatementImported;

    expect(event.data.transactions).toHaveLength(1);
    expect(event.data.transactions[0].amountCents).toBe(80000);
    expect(event.data.transactions[0].payerName).toBe('DUPONT JEAN');
  });

  it('should set fileName from command', async () => {
    const command = new ImportABankStatementCommand(
      'bs-4',
      'entity-1',
      'user_abc',
      'ba-1',
      'janvier-2026.csv',
      transactions,
    );

    await handler.execute(command);

    const savedAggregate = mockRepository.save.mock.calls[0][0];
    const events = savedAggregate.getUncommittedEvents();
    const event = events[0] as BankStatementImported;

    expect(event.data.fileName).toBe('janvier-2026.csv');
  });
});
