import { LinkABankConnectionHandler } from '../commands/link-a-bank-connection.handler';
import { LinkABankConnectionCommand } from '../commands/link-a-bank-connection.command';
import { EntityAggregate } from '../entity.aggregate';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

describe('LinkABankConnectionHandler', () => {
  let handler: LinkABankConnectionHandler;
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
    entity.commit();

    mockRepository = {
      load: jest.fn<Promise<EntityAggregate>, [string]>().mockResolvedValue(entity),
      save: jest.fn<Promise<void>, [EntityAggregate]>().mockResolvedValue(undefined),
    };
    handler = new LinkABankConnectionHandler(mockRepository as never);
  });

  it('should load entity, call linkBankConnection, and save', async () => {
    const command = new LinkABankConnectionCommand(
      'entity-id',
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

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('entity-id');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    expect(savedAggregate?.getUncommittedEvents().length).toBeGreaterThanOrEqual(1);
  });

  it('should delegate authorization to aggregate', async () => {
    const command = new LinkABankConnectionCommand(
      'entity-id',
      'user_wrong',
      'conn-1',
      'bank-account-1',
      'bridge',
      'BNP_BNPAFRPP',
      'BNP Paribas',
      'req-123',
      'agreement-456',
      '2026-05-20T00:00:00.000Z',
      [],
    );

    await expect(handler.execute(command)).rejects.toThrow(
      'You are not authorized to modify this entity',
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
