import { DisconnectABankConnectionHandler } from '../commands/disconnect-a-bank-connection.handler';
import { DisconnectABankConnectionCommand } from '../commands/disconnect-a-bank-connection.command';
import { EntityAggregate } from '../entity.aggregate';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

describe('DisconnectABankConnectionHandler', () => {
  let handler: DisconnectABankConnectionHandler;
  let mockRepository: {
    load: jest.Mock<Promise<EntityAggregate>, [string]>;
    save: jest.Mock<Promise<void>, [EntityAggregate]>;
  };
  let entity: EntityAggregate;

  beforeEach(() => {
    entity = new EntityAggregate('entity-id');
    entity.create(
      'user_clerk_123',
      'sci',
      'SCI TEST',
      'test@example.com',
      '12345678901234',
      {
        street: '1 rue Test',
        postalCode: '75001',
        city: 'Paris',
        country: 'France',
        complement: null,
      },
      null,
    );
    entity.addBankAccount(
      'user_clerk_123',
      'bank-account-1',
      'bank_account',
      'Compte BNP',
      'FR7630004000031234567890143',
      'BNPAFRPP',
      'BNP Paribas',
      true,
    );
    entity.linkBankConnection(
      'user_clerk_123',
      'conn-1',
      'bank-account-1',
      'bridge',
      'BNP_BNPAFRPP',
      'BNP Paribas',
      'req-123',
      'agreement-456',
      '2026-05-20T00:00:00.000Z',
      ['gc-account-1'],
    );
    entity.commit();

    mockRepository = {
      load: jest.fn<Promise<EntityAggregate>, [string]>().mockResolvedValue(entity),
      save: jest.fn<Promise<void>, [EntityAggregate]>().mockResolvedValue(undefined),
    };
    handler = new DisconnectABankConnectionHandler(mockRepository as never);
  });

  it('should load entity, call disconnectBankConnection, and save', async () => {
    const command = new DisconnectABankConnectionCommand(
      'entity-id',
      'user_clerk_123',
      'conn-1',
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('entity-id');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw if connection not found', async () => {
    const command = new DisconnectABankConnectionCommand(
      'entity-id',
      'user_clerk_123',
      'nonexistent',
    );

    await expect(handler.execute(command)).rejects.toThrow(
      'Bank connection nonexistent not found',
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
