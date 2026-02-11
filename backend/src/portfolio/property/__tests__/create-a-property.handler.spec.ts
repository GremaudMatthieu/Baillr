import { CreateAPropertyHandler } from '../commands/create-a-property.handler';
import { CreateAPropertyCommand } from '../commands/create-a-property.command';
import { PropertyAggregate } from '../property.aggregate';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

describe('CreateAPropertyHandler', () => {
  let handler: CreateAPropertyHandler;
  let mockRepository: { save: jest.Mock<Promise<void>, [PropertyAggregate]> };

  beforeEach(() => {
    mockRepository = {
      save: jest.fn<Promise<void>, [PropertyAggregate]>().mockResolvedValue(undefined),
    };
    handler = new CreateAPropertyHandler(mockRepository as never);
  });

  it('should create a new aggregate, call create, and save', async () => {
    const command = new CreateAPropertyCommand(
      'prop-id',
      'user_clerk_123',
      'entity-id',
      'Résidence Les Oliviers',
      'Immeuble',
      {
        street: '1 rue Test',
        postalCode: '75001',
        city: 'Paris',
        country: 'France',
        complement: null,
      },
    );

    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    expect(savedAggregate).toBeInstanceOf(PropertyAggregate);
    expect(savedAggregate?.id).toBe('prop-id');
    expect(savedAggregate?.getUncommittedEvents()).toHaveLength(1);
  });

  it('should pass all command fields to aggregate.create', async () => {
    const command = new CreateAPropertyCommand(
      'prop-id-2',
      'user_clerk_456',
      'entity-id-2',
      'Maison Bleue',
      null,
      {
        street: '5 avenue Foch',
        postalCode: '31000',
        city: 'Toulouse',
        country: 'France',
        complement: 'Bâtiment B',
      },
    );

    await handler.execute(command);

    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    const event = savedAggregate?.getUncommittedEvents()[0] as { data: Record<string, unknown> };
    expect(event.data).toMatchObject({
      id: 'prop-id-2',
      userId: 'user_clerk_456',
      entityId: 'entity-id-2',
      name: 'Maison Bleue',
      type: null,
    });
  });

  it('should propagate domain exceptions from aggregate', async () => {
    const command = new CreateAPropertyCommand(
      'prop-id',
      'user_clerk_123',
      'entity-id',
      '', // Empty name should throw
      null,
      {
        street: '1 rue Test',
        postalCode: '75001',
        city: 'Paris',
        country: 'France',
        complement: null,
      },
    );

    await expect(handler.execute(command)).rejects.toThrow('Property name is required');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
