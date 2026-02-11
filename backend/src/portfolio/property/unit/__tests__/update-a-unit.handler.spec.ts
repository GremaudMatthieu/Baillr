import { UpdateAUnitHandler } from '../commands/update-a-unit.handler';
import { UpdateAUnitCommand } from '../commands/update-a-unit.command';
import { UnitAggregate } from '../unit.aggregate';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
jest.mock('nestjs-cqrx', () => require('./mock-cqrx').mockCqrx);

describe('UpdateAUnitHandler', () => {
  let handler: UpdateAUnitHandler;
  let mockRepository: {
    load: jest.Mock<Promise<UnitAggregate>, [string]>;
    save: jest.Mock<Promise<void>, [UnitAggregate]>;
  };
  let existingAggregate: UnitAggregate;

  beforeEach(() => {
    existingAggregate = new UnitAggregate('unit-id');
    existingAggregate.create('user_clerk_123', 'property-id', 'Apt 3B', 'apartment', 3, 65.5, [
      { label: 'Entretien chaudière', amountCents: 1500 },
    ]);
    existingAggregate.commit();

    mockRepository = {
      load: jest.fn<Promise<UnitAggregate>, [string]>().mockResolvedValue(existingAggregate),
      save: jest.fn<Promise<void>, [UnitAggregate]>().mockResolvedValue(undefined),
    };
    handler = new UpdateAUnitHandler(mockRepository as never);
  });

  it('should load aggregate, call update, and save', async () => {
    const command = new UpdateAUnitCommand('unit-id', 'user_clerk_123', 'Apt 4A');

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('unit-id');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    expect(savedAggregate?.getUncommittedEvents()).toHaveLength(1);
  });

  it('should pass update fields to aggregate', async () => {
    const command = new UpdateAUnitCommand(
      'unit-id',
      'user_clerk_123',
      'Apt 4A',
      'commercial',
      5,
      120,
      [{ label: 'Parking', amountCents: 5000 }],
    );

    await handler.execute(command);

    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    const event = savedAggregate?.getUncommittedEvents()[0] as { data: Record<string, unknown> };
    expect(event.data).toMatchObject({
      identifier: 'Apt 4A',
      type: 'commercial',
      floor: 5,
      surfaceArea: 120,
    });
  });

  it('should update only floor when provided alone', async () => {
    const command = new UpdateAUnitCommand('unit-id', 'user_clerk_123', undefined, undefined, 7);

    await handler.execute(command);

    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    const event = savedAggregate?.getUncommittedEvents()[0] as { data: Record<string, unknown> };
    expect(event.data).toMatchObject({ floor: 7 });
    expect(event.data).not.toHaveProperty('identifier');
    expect(event.data).not.toHaveProperty('type');
  });

  it('should update only billableOptions when provided alone', async () => {
    const command = new UpdateAUnitCommand(
      'unit-id',
      'user_clerk_123',
      undefined,
      undefined,
      undefined,
      undefined,
      [{ label: 'Eau chaude', amountCents: 2000 }],
    );

    await handler.execute(command);

    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    const event = savedAggregate?.getUncommittedEvents()[0] as { data: Record<string, unknown> };
    expect(event.data).toHaveProperty('billableOptions');
  });

  it('should set floor to null to clear it', async () => {
    const command = new UpdateAUnitCommand('unit-id', 'user_clerk_123', undefined, undefined, null);

    await handler.execute(command);

    const savedAggregate = mockRepository.save.mock.calls[0]?.[0];
    const event = savedAggregate?.getUncommittedEvents()[0] as { data: Record<string, unknown> };
    expect(event.data).toMatchObject({ floor: null });
  });

  it('should propagate domain exceptions from aggregate', async () => {
    const command = new UpdateAUnitCommand('unit-id', 'user_another', 'Hacked');

    await expect(handler.execute(command)).rejects.toThrow(
      'You are not authorized to access this unit',
    );
    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
