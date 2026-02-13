import { UpdateAnEntityHandler } from '../commands/update-an-entity.handler';
import { UpdateAnEntityCommand } from '../commands/update-an-entity.command';
import { EntityAggregate } from '../entity.aggregate';
import { DomainException } from '../../../shared/exceptions/domain.exception';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

function createExistingAggregate(id: string): EntityAggregate {
  const aggregate = new EntityAggregate(id);
  aggregate.create(
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
  aggregate.commit();
  return aggregate;
}

describe('UpdateAnEntityHandler', () => {
  let handler: UpdateAnEntityHandler;
  let mockRepository: {
    save: jest.Mock<Promise<void>, [EntityAggregate]>;
    load: jest.Mock<Promise<EntityAggregate>, [string]>;
  };

  beforeEach(() => {
    mockRepository = {
      save: jest.fn<Promise<void>, [EntityAggregate]>().mockResolvedValue(undefined),
      load: jest.fn<Promise<EntityAggregate>, [string]>(),
    };
    handler = new UpdateAnEntityHandler(mockRepository as never);
  });

  it('should load aggregate, call update, and save', async () => {
    const existingAggregate = createExistingAggregate('entity-1');
    mockRepository.load.mockResolvedValue(existingAggregate);

    const command = new UpdateAnEntityCommand('entity-1', 'user_clerk_123', 'Updated Name', undefined);

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('entity-1');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    expect(savedAggregate?.getUncommittedEvents()).toHaveLength(1);
  });

  it('should pass update fields from command to aggregate', async () => {
    const existingAggregate = createExistingAggregate('entity-2');
    mockRepository.load.mockResolvedValue(existingAggregate);

    const newAddress = {
      street: '10 rue Neuve',
      postalCode: '31000',
      city: 'Toulouse',
      country: 'France',
      complement: 'Appt 5',
    };
    const command = new UpdateAnEntityCommand(
      'entity-2',
      'user_clerk_123',
      'Nouveau Nom',
      undefined,
      '98765432109876',
      newAddress,
      'Nouvelles infos',
    );

    await handler.execute(command);

    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    const event = savedAggregate?.getUncommittedEvents()[0] as { data: Record<string, unknown> };
    expect(event.data).toMatchObject({
      name: 'Nouveau Nom',
      siret: '98765432109876',
      address: newAddress,
      legalInformation: 'Nouvelles infos',
    });
  });

  it('should propagate domain exceptions from aggregate', async () => {
    const existingAggregate = createExistingAggregate('entity-3');
    mockRepository.load.mockResolvedValue(existingAggregate);

    const command = new UpdateAnEntityCommand('entity-3', 'user_clerk_123', '', undefined);

    await expect(handler.execute(command)).rejects.toThrow('Entity name is required');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate repository load errors', async () => {
    mockRepository.load.mockRejectedValue(new Error('Aggregate not found'));

    const command = new UpdateAnEntityCommand('nonexistent', 'user_clerk_123', 'Name', undefined);

    await expect(handler.execute(command)).rejects.toThrow('Aggregate not found');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when user does not own the entity', async () => {
    const existingAggregate = createExistingAggregate('entity-4');
    mockRepository.load.mockResolvedValue(existingAggregate);

    // entity was created with 'user_clerk_123', try to update with 'user_another'
    const command = new UpdateAnEntityCommand('entity-4', 'user_another', 'Hacked Name', undefined);

    await expect(handler.execute(command)).rejects.toThrow(DomainException);
    await expect(handler.execute(command)).rejects.toThrow(
      'You are not authorized to modify this entity',
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
