import { CreateAnEntityHandler } from '../commands/create-an-entity.handler';
import { CreateAnEntityCommand } from '../commands/create-an-entity.command';
import { EntityAggregate } from '../entity.aggregate';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

describe('CreateAnEntityHandler', () => {
  let handler: CreateAnEntityHandler;
  let mockRepository: { save: jest.Mock<Promise<void>, [EntityAggregate]> };

  beforeEach(() => {
    mockRepository = {
      save: jest.fn<Promise<void>, [EntityAggregate]>().mockResolvedValue(undefined),
    };
    handler = new CreateAnEntityHandler(mockRepository as never);
  });

  it('should create a new aggregate, call create, and save', async () => {
    const command = new CreateAnEntityCommand(
      'test-id',
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

    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    expect(savedAggregate).toBeInstanceOf(EntityAggregate);
    expect(savedAggregate?.id).toBe('test-id');
    expect(savedAggregate?.getUncommittedEvents()).toHaveLength(1);
  });

  it('should pass all command fields to aggregate.create', async () => {
    const command = new CreateAnEntityCommand(
      'test-id-2',
      'user_clerk_456',
      'nom_propre',
      'Jean Dupont',
      'jean@example.com',
      null,
      {
        street: '5 avenue Foch',
        postalCode: '31000',
        city: 'Toulouse',
        country: 'France',
        complement: null,
      },
      'Info légale',
    );

    await handler.execute(command);

    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    const event = savedAggregate?.getUncommittedEvents()[0] as { data: Record<string, unknown> };
    expect(event.data).toMatchObject({
      id: 'test-id-2',
      userId: 'user_clerk_456',
      type: 'nom_propre',
      name: 'Jean Dupont',
    });
  });

  it('should propagate domain exceptions from aggregate', async () => {
    const command = new CreateAnEntityCommand(
      'test-id',
      'user_clerk_123',
      'sci',
      'SCI TEST',
      'test@example.com',
      null, // SCI without SIRET should throw
      {
        street: '1 rue Test',
        postalCode: '75001',
        city: 'Paris',
        country: 'France',
        complement: null,
      },
      null,
    );

    await expect(handler.execute(command)).rejects.toThrow('SIRET is required for SCI entities');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
