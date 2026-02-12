import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { TerminateALeaseController } from '../controllers/terminate-a-lease.controller';
import { TerminateALeaseCommand } from '@tenancy/lease/commands/terminate-a-lease.command';
import { LeaseFinder } from '../finders/lease.finder';

describe('TerminateALeaseController', () => {
  let controller: TerminateALeaseController;
  let commandBus: { execute: jest.Mock<Promise<void>, [unknown]> };
  let leaseFinder: { findByIdAndUser: jest.Mock };

  const leaseId = '550e8400-e29b-41d4-a716-446655440000';
  const entityId = '550e8400-e29b-41d4-a716-446655440001';
  const userId = 'user_clerk_123';

  const validDto = {
    endDate: '2026-06-15T00:00:00.000Z',
  };

  beforeEach(async () => {
    commandBus = { execute: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined) };
    leaseFinder = {
      findByIdAndUser: jest.fn().mockResolvedValue({ id: leaseId, entityId, userId }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TerminateALeaseController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: LeaseFinder, useValue: leaseFinder },
      ],
    }).compile();

    controller = module.get<TerminateALeaseController>(TerminateALeaseController);
  });

  it('should dispatch TerminateALeaseCommand with valid data (202)', async () => {
    const result = await controller.handle(leaseId, validDto, userId);

    expect(result).toBeUndefined();
    expect(leaseFinder.findByIdAndUser).toHaveBeenCalledWith(leaseId, userId);

    const command = commandBus.execute.mock.calls[0]?.[0] as TerminateALeaseCommand;
    expect(command).toBeInstanceOf(TerminateALeaseCommand);
    expect(command.leaseId).toBe(leaseId);
    expect(command.endDate).toBe('2026-06-15T00:00:00.000Z');
  });

  it('should throw UnauthorizedException when lease not found', async () => {
    leaseFinder.findByIdAndUser.mockResolvedValue(null);

    await expect(controller.handle(leaseId, validDto, userId)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should propagate domain exceptions from command bus', async () => {
    commandBus.execute.mockRejectedValue(new Error('Ce bail est déjà résilié'));

    await expect(controller.handle(leaseId, validDto, userId)).rejects.toThrow(
      'Ce bail est déjà résilié',
    );
  });

  it('should dispatch command with different end dates', async () => {
    const alternateDto = { endDate: '2026-12-31T00:00:00.000Z' };
    await controller.handle(leaseId, alternateDto, userId);

    const command = commandBus.execute.mock.calls[0]?.[0] as TerminateALeaseCommand;
    expect(command.endDate).toBe('2026-12-31T00:00:00.000Z');
  });
});
