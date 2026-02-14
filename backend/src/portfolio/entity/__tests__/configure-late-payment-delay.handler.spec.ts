import { ConfigureLatePaymentDelayHandler } from '../commands/configure-late-payment-delay.handler';
import { ConfigureLatePaymentDelayCommand } from '../commands/configure-late-payment-delay.command';
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

describe('ConfigureLatePaymentDelayHandler', () => {
  let handler: ConfigureLatePaymentDelayHandler;
  let mockRepository: {
    save: jest.Mock<Promise<void>, [EntityAggregate]>;
    load: jest.Mock<Promise<EntityAggregate>, [string]>;
  };

  beforeEach(() => {
    mockRepository = {
      save: jest.fn<Promise<void>, [EntityAggregate]>().mockResolvedValue(undefined),
      load: jest.fn<Promise<EntityAggregate>, [string]>(),
    };
    handler = new ConfigureLatePaymentDelayHandler(mockRepository as never);
  });

  it('should load aggregate, call configureLatePaymentDelay, and save', async () => {
    const existingAggregate = createExistingAggregate('entity-1');
    mockRepository.load.mockResolvedValue(existingAggregate);

    const command = new ConfigureLatePaymentDelayCommand('entity-1', 'user_clerk_123', 10);

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('entity-1');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    expect(savedAggregate?.getUncommittedEvents()).toHaveLength(1);
    const event = savedAggregate?.getUncommittedEvents()[0] as {
      data: { latePaymentDelayDays: number };
    };
    expect(event.data.latePaymentDelayDays).toBe(10);
  });

  it('should not emit event when value is unchanged (no-op guard)', async () => {
    const existingAggregate = createExistingAggregate('entity-2');
    mockRepository.load.mockResolvedValue(existingAggregate);

    // Default is 5, configure to 5 — should be no-op
    const command = new ConfigureLatePaymentDelayCommand('entity-2', 'user_clerk_123', 5);

    await handler.execute(command);

    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    expect(savedAggregate?.getUncommittedEvents()).toHaveLength(0);
  });

  it('should throw when user does not own the entity', async () => {
    const existingAggregate = createExistingAggregate('entity-3');
    mockRepository.load.mockResolvedValue(existingAggregate);

    const command = new ConfigureLatePaymentDelayCommand('entity-3', 'user_another', 10);

    await expect(handler.execute(command)).rejects.toThrow(DomainException);
    await expect(handler.execute(command)).rejects.toThrow(
      'You are not authorized to modify this entity',
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when entity does not exist', async () => {
    const aggregate = new EntityAggregate('entity-4');
    mockRepository.load.mockResolvedValue(aggregate);

    const command = new ConfigureLatePaymentDelayCommand('entity-4', 'user_clerk_123', 10);

    await expect(handler.execute(command)).rejects.toThrow(DomainException);
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should reject invalid days value', async () => {
    const existingAggregate = createExistingAggregate('entity-5');
    mockRepository.load.mockResolvedValue(existingAggregate);

    const command = new ConfigureLatePaymentDelayCommand('entity-5', 'user_clerk_123', 91);

    await expect(handler.execute(command)).rejects.toThrow(DomainException);
    await expect(handler.execute(command)).rejects.toThrow(
      'Late payment delay days must be at most 90',
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
