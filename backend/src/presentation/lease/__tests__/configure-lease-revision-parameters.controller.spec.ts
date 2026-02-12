import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigureLeaseRevisionParametersController } from '../controllers/configure-lease-revision-parameters.controller';
import { ConfigureLeaseRevisionParametersCommand } from '@tenancy/lease/commands/configure-lease-revision-parameters.command';
import { LeaseFinder } from '../finders/lease.finder';

describe('ConfigureLeaseRevisionParametersController', () => {
  let controller: ConfigureLeaseRevisionParametersController;
  let commandBus: { execute: jest.Mock<Promise<void>, [unknown]> };
  let leaseFinder: { findByIdAndUser: jest.Mock };

  const leaseId = '550e8400-e29b-41d4-a716-446655440000';
  const entityId = '550e8400-e29b-41d4-a716-446655440001';
  const userId = 'user_clerk_123';

  const validDto = {
    revisionDay: 15,
    revisionMonth: 3,
    referenceQuarter: 'Q2',
    referenceYear: 2025,
    baseIndexValue: 142.06,
  };

  beforeEach(async () => {
    commandBus = { execute: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined) };
    leaseFinder = {
      findByIdAndUser: jest.fn().mockResolvedValue({ id: leaseId, entityId, userId }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigureLeaseRevisionParametersController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: LeaseFinder, useValue: leaseFinder },
      ],
    }).compile();

    controller = module.get<ConfigureLeaseRevisionParametersController>(
      ConfigureLeaseRevisionParametersController,
    );
  });

  it('should dispatch ConfigureLeaseRevisionParametersCommand with valid data (202)', async () => {
    const result = await controller.handle(leaseId, validDto, userId);

    expect(result).toBeUndefined();
    expect(leaseFinder.findByIdAndUser).toHaveBeenCalledWith(leaseId, userId);

    const command = commandBus.execute.mock.calls[0]?.[0] as ConfigureLeaseRevisionParametersCommand;
    expect(command).toBeInstanceOf(ConfigureLeaseRevisionParametersCommand);
    expect(command.leaseId).toBe(leaseId);
    expect(command.revisionDay).toBe(15);
    expect(command.revisionMonth).toBe(3);
    expect(command.referenceQuarter).toBe('Q2');
    expect(command.referenceYear).toBe(2025);
    expect(command.baseIndexValue).toBe(142.06);
  });

  it('should throw UnauthorizedException when lease not found', async () => {
    leaseFinder.findByIdAndUser.mockResolvedValue(null);

    await expect(controller.handle(leaseId, validDto, userId)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should dispatch command with null base index value', async () => {
    const dtoWithNull = {
      revisionDay: 1,
      revisionMonth: 1,
      referenceQuarter: 'Q1',
      referenceYear: 2026,
      baseIndexValue: undefined,
    };

    await controller.handle(leaseId, dtoWithNull, userId);

    const command = commandBus.execute.mock.calls[0]?.[0] as ConfigureLeaseRevisionParametersCommand;
    expect(command.baseIndexValue).toBeNull();
  });

  it('should pass through explicit null base index value', async () => {
    const dtoWithExplicitNull = {
      revisionDay: 15,
      revisionMonth: 6,
      referenceQuarter: 'Q3',
      referenceYear: 2025,
      baseIndexValue: null,
    };

    await controller.handle(leaseId, dtoWithExplicitNull, userId);

    const command = commandBus.execute.mock.calls[0]?.[0] as ConfigureLeaseRevisionParametersCommand;
    expect(command.baseIndexValue).toBeNull();
  });

  it('should dispatch command for all valid quarter values', async () => {
    for (const quarter of ['Q1', 'Q2', 'Q3', 'Q4']) {
      commandBus.execute.mockClear();
      await controller.handle(leaseId, { ...validDto, referenceQuarter: quarter }, userId);

      const command = commandBus.execute.mock.calls[0]?.[0] as ConfigureLeaseRevisionParametersCommand;
      expect(command.referenceQuarter).toBe(quarter);
    }
  });
});
