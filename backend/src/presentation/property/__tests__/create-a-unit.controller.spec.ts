import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { CreateAUnitController } from '../controllers/create-a-unit.controller';
import { CreateAUnitCommand } from '@portfolio/property/unit/commands/create-a-unit.command';
import { PropertyFinder } from '../finders/property.finder';

describe('CreateAUnitController', () => {
  let controller: CreateAUnitController;
  let commandBus: { execute: jest.Mock<Promise<void>, [unknown]> };
  let propertyFinder: { findByIdAndUser: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined) };
    propertyFinder = {
      findByIdAndUser: jest.fn().mockResolvedValue({ id: 'property-id', userId: 'user_clerk_123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateAUnitController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: PropertyFinder, useValue: propertyFinder },
      ],
    }).compile();

    controller = module.get<CreateAUnitController>(CreateAUnitController);
  });

  it('should verify property ownership before dispatching command', async () => {
    const propertyId = '550e8400-e29b-41d4-a716-446655440001';
    const dto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      identifier: 'Apt 3B',
      type: 'apartment',
      floor: 3,
      surfaceArea: 65.5,
      billableOptions: [{ label: 'Entretien chaudière', amountCents: 1500 }],
    };

    await controller.handle(propertyId, dto, 'user_clerk_123');

    expect(propertyFinder.findByIdAndUser).toHaveBeenCalledWith(propertyId, 'user_clerk_123');
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw UnauthorizedException when property does not belong to user', async () => {
    propertyFinder.findByIdAndUser.mockResolvedValue(null);

    const dto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      identifier: 'Apt 3B',
      type: 'apartment',
      surfaceArea: 65.5,
    };

    await expect(controller.handle('property-id', dto, 'user_clerk_123')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should dispatch CreateAUnitCommand via commandBus', async () => {
    const propertyId = '550e8400-e29b-41d4-a716-446655440001';
    const dto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      identifier: 'Apt 3B',
      type: 'apartment',
      floor: 3,
      surfaceArea: 65.5,
      billableOptions: [{ label: 'Entretien chaudière', amountCents: 1500 }],
    };

    await controller.handle(propertyId, dto, 'user_clerk_123');

    const command = commandBus.execute.mock.calls[0]?.[0] as CreateAUnitCommand;
    expect(command).toBeInstanceOf(CreateAUnitCommand);
    expect(command.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(command.userId).toBe('user_clerk_123');
    expect(command.propertyId).toBe(propertyId);
    expect(command.identifier).toBe('Apt 3B');
    expect(command.type).toBe('apartment');
    expect(command.floor).toBe(3);
    expect(command.surfaceArea).toBe(65.5);
    expect(command.billableOptions).toEqual([{ label: 'Entretien chaudière', amountCents: 1500 }]);
  });

  it('should set floor to null when not provided', async () => {
    const dto = {
      id: '660e8400-e29b-41d4-a716-446655440001',
      identifier: 'Cave A',
      type: 'storage',
      surfaceArea: 10,
    };

    await controller.handle('property-id', dto, 'user_clerk_456');

    const command = commandBus.execute.mock.calls[0]?.[0] as CreateAUnitCommand;
    expect(command.floor).toBeNull();
    expect(command.billableOptions).toEqual([]);
  });

  it('should return void (202 Accepted)', async () => {
    const dto = {
      id: '770e8400-e29b-41d4-a716-446655440002',
      identifier: 'Parking B1',
      type: 'parking',
      surfaceArea: 15,
    };

    const result = await controller.handle('property-id', dto, 'user_clerk_789');
    expect(result).toBeUndefined();
  });
});
