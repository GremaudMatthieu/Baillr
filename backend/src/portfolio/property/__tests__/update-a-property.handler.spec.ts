import { UpdateAPropertyHandler } from '../commands/update-a-property.handler';
import { UpdateAPropertyCommand } from '../commands/update-a-property.command';
import { PropertyAggregate } from '../property.aggregate';
import { DomainException } from '../../../shared/exceptions/domain.exception';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

function createExistingProperty(id: string): PropertyAggregate {
  const aggregate = new PropertyAggregate(id);
  aggregate.create('user_clerk_123', 'entity-1', 'Résidence Les Oliviers', 'Immeuble', {
    street: '1 rue Test',
    postalCode: '75001',
    city: 'Paris',
    country: 'France',
    complement: null,
  });
  aggregate.commit();
  return aggregate;
}

describe('UpdateAPropertyHandler', () => {
  let handler: UpdateAPropertyHandler;
  let mockRepository: {
    save: jest.Mock<Promise<void>, [PropertyAggregate]>;
    load: jest.Mock<Promise<PropertyAggregate>, [string]>;
  };

  beforeEach(() => {
    mockRepository = {
      save: jest.fn<Promise<void>, [PropertyAggregate]>().mockResolvedValue(undefined),
      load: jest.fn<Promise<PropertyAggregate>, [string]>(),
    };
    handler = new UpdateAPropertyHandler(mockRepository as never);
  });

  it('should load aggregate, call update, and save', async () => {
    const existingProperty = createExistingProperty('prop-1');
    mockRepository.load.mockResolvedValue(existingProperty);

    const command = new UpdateAPropertyCommand('prop-1', 'user_clerk_123', 'Updated Name');

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('prop-1');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    expect(savedAggregate?.getUncommittedEvents()).toHaveLength(1);
  });

  it('should pass update fields from command to aggregate', async () => {
    const existingProperty = createExistingProperty('prop-2');
    mockRepository.load.mockResolvedValue(existingProperty);

    const newAddress = {
      street: '10 rue Neuve',
      postalCode: '31000',
      city: 'Toulouse',
      country: 'France',
      complement: 'Appt 5',
    };
    const command = new UpdateAPropertyCommand(
      'prop-2',
      'user_clerk_123',
      'Nouveau Nom',
      'Maison',
      newAddress,
    );

    await handler.execute(command);

    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    const event = savedAggregate?.getUncommittedEvents()[0] as { data: Record<string, unknown> };
    expect(event.data).toMatchObject({
      name: 'Nouveau Nom',
      type: 'Maison',
      address: newAddress,
    });
  });

  it('should propagate domain exceptions from aggregate', async () => {
    const existingProperty = createExistingProperty('prop-3');
    mockRepository.load.mockResolvedValue(existingProperty);

    const command = new UpdateAPropertyCommand('prop-3', 'user_clerk_123', '');

    await expect(handler.execute(command)).rejects.toThrow('Property name is required');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate repository load errors', async () => {
    mockRepository.load.mockRejectedValue(new Error('Aggregate not found'));

    const command = new UpdateAPropertyCommand('nonexistent', 'user_clerk_123', 'Name');

    await expect(handler.execute(command)).rejects.toThrow('Aggregate not found');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when user does not own the property', async () => {
    const existingProperty = createExistingProperty('prop-4');
    mockRepository.load.mockResolvedValue(existingProperty);

    const command = new UpdateAPropertyCommand('prop-4', 'user_another', 'Hacked Name');

    try {
      await handler.execute(command);
      throw new Error('Expected DomainException to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(DomainException);
      expect((err as Error).message).toBe('You are not authorized to access this property');
    }
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
