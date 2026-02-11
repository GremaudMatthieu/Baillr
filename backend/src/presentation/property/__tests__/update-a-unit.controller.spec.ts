import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { UpdateAUnitController } from '../controllers/update-a-unit.controller';
import { UpdateAUnitCommand } from '@portfolio/property/unit/commands/update-a-unit.command';
import { UnitFinder } from '../finders/unit.finder';

describe('UpdateAUnitController', () => {
  let controller: UpdateAUnitController;
  let commandBus: { execute: jest.Mock<Promise<void>, [unknown]> };
  let unitFinder: { findByIdAndUser: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined) };
    unitFinder = {
      findByIdAndUser: jest.fn().mockResolvedValue({ id: 'unit-id', userId: 'user_clerk_123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UpdateAUnitController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: UnitFinder, useValue: unitFinder },
      ],
    }).compile();

    controller = module.get<UpdateAUnitController>(UpdateAUnitController);
  });

  it('should verify unit ownership before dispatching command', async () => {
    const dto = { identifier: 'Apt 4A' };

    await controller.handle('unit-id', dto, 'user_clerk_123');

    expect(unitFinder.findByIdAndUser).toHaveBeenCalledWith('unit-id', 'user_clerk_123');
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw UnauthorizedException when unit does not belong to user', async () => {
    unitFinder.findByIdAndUser.mockResolvedValue(null);

    const dto = { identifier: 'Hacked' };

    await expect(controller.handle('unit-id', dto, 'user_clerk_123')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should dispatch UpdateAUnitCommand via commandBus', async () => {
    const dto = {
      identifier: 'Apt 4A',
      type: 'commercial',
      floor: 5,
      surfaceArea: 120,
      billableOptions: [{ label: 'Parking', amountCents: 5000 }],
    };

    await controller.handle('unit-id', dto, 'user_clerk_123');

    const command = commandBus.execute.mock.calls[0]?.[0] as UpdateAUnitCommand;
    expect(command).toBeInstanceOf(UpdateAUnitCommand);
    expect(command.id).toBe('unit-id');
    expect(command.userId).toBe('user_clerk_123');
    expect(command.identifier).toBe('Apt 4A');
    expect(command.type).toBe('commercial');
    expect(command.floor).toBe(5);
    expect(command.surfaceArea).toBe(120);
    expect(command.billableOptions).toEqual([{ label: 'Parking', amountCents: 5000 }]);
  });

  it('should return void (202 Accepted)', async () => {
    const dto = { identifier: 'Parking B2' };

    const result = await controller.handle('unit-id', dto, 'user_clerk_789');
    expect(result).toBeUndefined();
  });
});
