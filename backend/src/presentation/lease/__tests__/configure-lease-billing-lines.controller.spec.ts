import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigureLeaseBillingLinesController } from '../controllers/configure-lease-billing-lines.controller';
import { ConfigureLeaseBillingLinesCommand } from '@tenancy/lease/commands/configure-lease-billing-lines.command';
import { LeaseFinder } from '../finders/lease.finder';

describe('ConfigureLeaseBillingLinesController', () => {
  let controller: ConfigureLeaseBillingLinesController;
  let commandBus: { execute: jest.Mock<Promise<void>, [unknown]> };
  let leaseFinder: { findByIdAndUser: jest.Mock };

  const leaseId = '550e8400-e29b-41d4-a716-446655440000';
  const entityId = '550e8400-e29b-41d4-a716-446655440001';
  const userId = 'user_clerk_123';

  const validDto = {
    billingLines: [
      { label: 'Provisions sur charges', amountCents: 5000, type: 'provision' },
      { label: 'Parking', amountCents: 3000, type: 'option' },
    ],
  };

  beforeEach(async () => {
    commandBus = { execute: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined) };
    leaseFinder = {
      findByIdAndUser: jest.fn().mockResolvedValue({ id: leaseId, entityId, userId }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigureLeaseBillingLinesController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: LeaseFinder, useValue: leaseFinder },
      ],
    }).compile();

    controller = module.get<ConfigureLeaseBillingLinesController>(
      ConfigureLeaseBillingLinesController,
    );
  });

  it('should dispatch ConfigureLeaseBillingLinesCommand with valid data (202)', async () => {
    const result = await controller.handle(leaseId, validDto, userId);

    expect(result).toBeUndefined();
    expect(leaseFinder.findByIdAndUser).toHaveBeenCalledWith(leaseId, userId);

    const command = commandBus.execute.mock.calls[0]?.[0] as ConfigureLeaseBillingLinesCommand;
    expect(command).toBeInstanceOf(ConfigureLeaseBillingLinesCommand);
    expect(command.leaseId).toBe(leaseId);
    expect(command.billingLines).toEqual([
      { label: 'Provisions sur charges', amountCents: 5000, type: 'provision' },
      { label: 'Parking', amountCents: 3000, type: 'option' },
    ]);
  });

  it('should throw UnauthorizedException when lease not found', async () => {
    leaseFinder.findByIdAndUser.mockResolvedValue(null);

    await expect(controller.handle(leaseId, validDto, userId)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should dispatch command with empty billing lines', async () => {
    const emptyDto = { billingLines: [] };

    await controller.handle(leaseId, emptyDto, userId);

    const command = commandBus.execute.mock.calls[0]?.[0] as ConfigureLeaseBillingLinesCommand;
    expect(command.billingLines).toEqual([]);
  });

  it('should dispatch command with all valid billing line types', async () => {
    const allTypesDto = {
      billingLines: [
        { label: 'Provisions', amountCents: 5000, type: 'provision' },
        { label: 'Parking', amountCents: 3000, type: 'option' },
      ],
    };

    await controller.handle(leaseId, allTypesDto, userId);

    const command = commandBus.execute.mock.calls[0]?.[0] as ConfigureLeaseBillingLinesCommand;
    expect(command.billingLines).toHaveLength(2);
  });
});
