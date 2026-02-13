import { UpdateABankAccountHandler } from '../commands/update-a-bank-account.handler';
import { UpdateABankAccountCommand } from '../commands/update-a-bank-account.command';
import { EntityAggregate } from '../entity.aggregate';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

describe('UpdateABankAccountHandler', () => {
  let handler: UpdateABankAccountHandler;
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
      'account-1',
      'bank_account',
      'Compte LCL',
      'FR7630002005500000157845Z02',
      'CRLYFRPP',
      'LCL',
      true,
    );
    entity.commit();

    mockRepository = {
      load: jest.fn<Promise<EntityAggregate>, [string]>().mockResolvedValue(entity),
      save: jest.fn<Promise<void>, [EntityAggregate]>().mockResolvedValue(undefined),
    };
    handler = new UpdateABankAccountHandler(mockRepository as never);
  });

  it('should load entity, call updateBankAccount, and save', async () => {
    const command = new UpdateABankAccountCommand(
      'entity-id',
      'user_clerk_123',
      'account-1',
      'Nouveau libellé',
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('entity-id');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should contain ZERO business logic — delegates entirely to aggregate', async () => {
    const command = new UpdateABankAccountCommand('entity-id', 'user_wrong', 'account-1', 'Hacked');

    await expect(handler.execute(command)).rejects.toThrow(
      'You are not authorized to modify this entity',
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
