import { AddABankAccountHandler } from '../commands/add-a-bank-account.handler';
import { AddABankAccountCommand } from '../commands/add-a-bank-account.command';
import { EntityAggregate } from '../entity.aggregate';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

describe('AddABankAccountHandler', () => {
  let handler: AddABankAccountHandler;
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
    entity.commit();

    mockRepository = {
      load: jest.fn<Promise<EntityAggregate>, [string]>().mockResolvedValue(entity),
      save: jest.fn<Promise<void>, [EntityAggregate]>().mockResolvedValue(undefined),
    };
    handler = new AddABankAccountHandler(mockRepository as never);
  });

  it('should load entity, call addBankAccount, and save', async () => {
    const command = new AddABankAccountCommand(
      'entity-id',
      'user_clerk_123',
      'account-1',
      'bank_account',
      'Compte LCL',
      'FR7630002005500000157845Z02',
      'CRLYFRPP',
      'LCL',
      true,
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('entity-id');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    expect(savedAggregate?.getUncommittedEvents().length).toBeGreaterThanOrEqual(1);
  });

  it('should contain ZERO business logic — delegates entirely to aggregate', async () => {
    const command = new AddABankAccountCommand(
      'entity-id',
      'user_wrong',
      'account-2',
      'bank_account',
      'Compte',
      'FR7630002005500000157845Z02',
      null,
      null,
      false,
    );

    // Should throw unauthorized — proves handler delegates to aggregate
    await expect(handler.execute(command)).rejects.toThrow(
      'You are not authorized to modify this entity',
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
