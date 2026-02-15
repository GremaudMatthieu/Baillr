import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigureLeaseBillingLinesController } from '../controllers/configure-lease-billing-lines.controller';
import { ConfigureLeaseBillingLinesCommand } from '@tenancy/lease/commands/configure-lease-billing-lines.command';
import { LeaseFinder } from '../finders/lease.finder';
import { ChargeCategoryFinder } from '../../charge-category/finders/charge-category.finder';

describe('ConfigureLeaseBillingLinesController', () => {
  let controller: ConfigureLeaseBillingLinesController;
  let commandBus: { execute: jest.Mock<Promise<void>, [unknown]> };
  let leaseFinder: { findByIdAndUser: jest.Mock };
  let chargeCategoryFinder: { findByIdsAndEntity: jest.Mock };

  const leaseId = '550e8400-e29b-41d4-a716-446655440000';
  const entityId = '550e8400-e29b-41d4-a716-446655440001';
  const userId = 'user_clerk_123';

  const validDto = {
    billingLines: [
      { chargeCategoryId: 'cat-water', amountCents: 5000 },
      { chargeCategoryId: 'cat-elec', amountCents: 3000 },
    ],
  };

  beforeEach(async () => {
    commandBus = { execute: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined) };
    leaseFinder = {
      findByIdAndUser: jest.fn().mockResolvedValue({ id: leaseId, entityId, userId }),
    };
    chargeCategoryFinder = {
      findByIdsAndEntity: jest.fn().mockResolvedValue([
        { id: 'cat-water', label: 'Eau', slug: 'water' },
        { id: 'cat-elec', label: 'Électricité', slug: 'electricity' },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigureLeaseBillingLinesController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: LeaseFinder, useValue: leaseFinder },
        { provide: ChargeCategoryFinder, useValue: chargeCategoryFinder },
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
    expect(chargeCategoryFinder.findByIdsAndEntity).toHaveBeenCalledWith(
      ['cat-water', 'cat-elec'],
      entityId,
    );

    const command = commandBus.execute.mock.calls[0]?.[0] as ConfigureLeaseBillingLinesCommand;
    expect(command).toBeInstanceOf(ConfigureLeaseBillingLinesCommand);
    expect(command.leaseId).toBe(leaseId);
    expect(command.billingLines).toEqual([
      { chargeCategoryId: 'cat-water', amountCents: 5000 },
      { chargeCategoryId: 'cat-elec', amountCents: 3000 },
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
    // Should NOT call chargeCategoryFinder when empty
    expect(chargeCategoryFinder.findByIdsAndEntity).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when charge category not found for entity', async () => {
    chargeCategoryFinder.findByIdsAndEntity.mockResolvedValue([
      { id: 'cat-water', label: 'Eau', slug: 'water' },
      // cat-elec missing — only 1 found out of 2 requested
    ]);

    await expect(controller.handle(leaseId, validDto, userId)).rejects.toThrow(
      BadRequestException,
    );
    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
