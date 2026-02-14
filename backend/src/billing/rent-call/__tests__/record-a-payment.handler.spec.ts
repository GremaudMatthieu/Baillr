// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);
jest.mock('@nestjs/cqrs', () => ({
  CommandHandler: () => () => {},
  ICommandHandler: class {},
}));

import { RecordAPaymentHandler } from '../commands/record-a-payment.handler';
import { RecordAPaymentCommand } from '../commands/record-a-payment.command';
import { RentCallAggregate } from '../rent-call.aggregate';

describe('RecordAPaymentHandler', () => {
  let handler: RecordAPaymentHandler;
  let mockRepository: {
    load: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    handler = new RecordAPaymentHandler(mockRepository as never);
  });

  it('should load aggregate, record payment, and save', async () => {
    // Create a generated aggregate
    const aggregate = new RentCallAggregate('rc-1');
    aggregate.generate(
      'entity-1',
      'user_123',
      'lease-1',
      'tenant-1',
      'unit-1',
      '2026-02',
      80000,
      [],
      80000,
      false,
      28,
      28,
    );
    aggregate.commit();
    mockRepository.load.mockResolvedValue(aggregate);

    const command = new RecordAPaymentCommand(
      'rc-1',
      'entity-1',
      'user_123',
      'tx-1',
      'bs-1',
      80000,
      'DOS SANTOS',
      '2026-02-10',
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('rc-1');
    expect(mockRepository.save).toHaveBeenCalledWith(aggregate);
  });

  it('should pass all command fields to aggregate recordPayment', async () => {
    const aggregate = new RentCallAggregate('rc-1');
    aggregate.generate(
      'entity-1',
      'user_123',
      'lease-1',
      'tenant-1',
      'unit-1',
      '2026-02',
      80000,
      [],
      80000,
      false,
      28,
      28,
    );
    aggregate.commit();
    mockRepository.load.mockResolvedValue(aggregate);

    const spy = jest.spyOn(aggregate, 'recordPayment');

    const command = new RecordAPaymentCommand(
      'rc-1',
      'entity-1',
      'user_123',
      'tx-1',
      'bs-1',
      80000,
      'DOS SANTOS',
      '2026-02-10',
    );

    await handler.execute(command);

    expect(spy).toHaveBeenCalledWith(
      'tx-1',
      'bs-1',
      80000,
      'DOS SANTOS',
      '2026-02-10',
      expect.any(Date),
      'user_123',
      'bank_transfer',
      null,
    );
  });
});
