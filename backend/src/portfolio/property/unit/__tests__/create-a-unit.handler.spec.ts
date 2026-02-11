import { CreateAUnitHandler } from '../commands/create-a-unit.handler';
import { CreateAUnitCommand } from '../commands/create-a-unit.command';
import { UnitAggregate } from '../unit.aggregate';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

describe('CreateAUnitHandler', () => {
  let handler: CreateAUnitHandler;
  let mockRepository: { save: jest.Mock<Promise<void>, [UnitAggregate]> };

  beforeEach(() => {
    mockRepository = {
      save: jest.fn<Promise<void>, [UnitAggregate]>().mockResolvedValue(undefined),
    };
    handler = new CreateAUnitHandler(mockRepository as never);
  });

  it('should create a new aggregate, call create, and save', async () => {
    const command = new CreateAUnitCommand(
      'unit-id',
      'user_clerk_123',
      'property-id',
      'Apt 3B',
      'apartment',
      3,
      65.5,
      [{ label: 'Entretien chaudière', amountCents: 1500 }],
    );

    await handler.execute(command);

    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    expect(savedAggregate).toBeInstanceOf(UnitAggregate);
    expect(savedAggregate?.id).toBe('unit-id');
    expect(savedAggregate?.getUncommittedEvents()).toHaveLength(1);
  });

  it('should pass all command fields to aggregate.create', async () => {
    const command = new CreateAUnitCommand(
      'unit-id-2',
      'user_clerk_456',
      'property-id-2',
      'Parking B1',
      'parking',
      -1,
      15,
      [],
    );

    await handler.execute(command);

    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    const event = savedAggregate?.getUncommittedEvents()[0] as { data: Record<string, unknown> };
    expect(event.data).toMatchObject({
      id: 'unit-id-2',
      userId: 'user_clerk_456',
      propertyId: 'property-id-2',
      identifier: 'Parking B1',
      type: 'parking',
      floor: -1,
      surfaceArea: 15,
      billableOptions: [],
    });
  });

  it('should propagate domain exceptions from aggregate', async () => {
    const command = new CreateAUnitCommand(
      'unit-id',
      'user_clerk_123',
      'property-id',
      '', // Empty identifier should throw
      'apartment',
      null,
      50,
      [],
    );

    await expect(handler.execute(command)).rejects.toThrow('Unit identifier is required');
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
