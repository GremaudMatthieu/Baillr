import { CreateAnEntityHandler } from '../commands/create-an-entity.handler';
import { CreateAnEntityCommand } from '../commands/create-an-entity.command';
import { EntityAggregate } from '../entity.aggregate';

jest.mock('nestjs-cqrx', () => {
  const EVENTS = Symbol('events');
  class MockEvent {
    data: Record<string, unknown>;
    metadata: Record<string, unknown>;
    type: string;
    constructor(data?: Record<string, unknown>, metadata?: Record<string, unknown>) {
      this.data = data ?? {};
      this.metadata = metadata ?? {};
      this.type = this.constructor.name;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function MockEventHandler(_event: unknown) {
    return function (_target: object, _key: string, descriptor: PropertyDescriptor) {
      return descriptor;
    };
  }

  class MockAggregateRoot {
    streamId: string;
    id: string;
    [EVENTS]: unknown[] = [];
    constructor(id?: string) {
      this.id = id ?? '';
      this.streamId = `entity_${String(id)}`;
    }
    apply(event: { constructor: { name: string } }) {
      this[EVENTS].push(event);
      const handlerName = `on${event.constructor.name}`;
      const self = this as unknown as Record<string, (...args: unknown[]) => void>;
      if (typeof self[handlerName] === 'function') {
        self[handlerName](event);
      }
    }
    getUncommittedEvents() {
      return [...this[EVENTS]];
    }
    commit() {
      this[EVENTS].length = 0;
    }
  }

  return {
    AggregateRoot: MockAggregateRoot,
    Event: MockEvent,
    EventHandler: MockEventHandler,
    InjectAggregateRepository: () => () => {},
    AggregateRepository: class {},
    CqrxModule: { forRoot: () => ({}), forFeature: () => ({}) },
  };
});

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
