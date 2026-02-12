import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { CreateALeaseController } from '../controllers/create-a-lease.controller';
import { CreateALeaseCommand } from '@tenancy/lease/commands/create-a-lease.command';
import { EntityFinder } from '../../entity/finders/entity.finder';
import { TenantFinder } from '../../tenant/finders/tenant.finder';
import { UnitFinder } from '../../property/finders/unit.finder';
import { LeaseFinder } from '../finders/lease.finder';

describe('CreateALeaseController', () => {
  let controller: CreateALeaseController;
  let commandBus: { execute: jest.Mock<Promise<void>, [unknown]> };
  let entityFinder: { findByIdAndUserId: jest.Mock };
  let tenantFinder: { findByIdAndUser: jest.Mock };
  let unitFinder: { findByIdAndUser: jest.Mock };
  let leaseFinder: { findByUnitId: jest.Mock };

  const entityId = '550e8400-e29b-41d4-a716-446655440001';
  const userId = 'user_clerk_123';

  const validDto = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    tenantId: '660e8400-e29b-41d4-a716-446655440001',
    unitId: '770e8400-e29b-41d4-a716-446655440002',
    startDate: '2026-03-01T00:00:00.000Z',
    rentAmountCents: 63000,
    securityDepositCents: 63000,
    monthlyDueDate: 5,
    revisionIndexType: 'IRL',
  };

  beforeEach(async () => {
    commandBus = { execute: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined) };
    entityFinder = {
      findByIdAndUserId: jest.fn().mockResolvedValue({ id: entityId, userId }),
    };
    tenantFinder = {
      findByIdAndUser: jest.fn().mockResolvedValue({ id: validDto.tenantId, entityId, userId }),
    };
    unitFinder = {
      findByIdAndUser: jest
        .fn()
        .mockResolvedValue({ id: validDto.unitId, propertyId: 'prop-1', userId }),
    };
    leaseFinder = {
      findByUnitId: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateALeaseController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: EntityFinder, useValue: entityFinder },
        { provide: TenantFinder, useValue: tenantFinder },
        { provide: UnitFinder, useValue: unitFinder },
        { provide: LeaseFinder, useValue: leaseFinder },
      ],
    }).compile();

    controller = module.get<CreateALeaseController>(CreateALeaseController);
  });

  it('should dispatch CreateALeaseCommand with valid data (202)', async () => {
    const result = await controller.handle(entityId, validDto, userId);

    expect(result).toBeUndefined();
    expect(entityFinder.findByIdAndUserId).toHaveBeenCalledWith(entityId, userId);
    expect(tenantFinder.findByIdAndUser).toHaveBeenCalledWith(validDto.tenantId, userId);
    expect(unitFinder.findByIdAndUser).toHaveBeenCalledWith(validDto.unitId, userId);
    expect(leaseFinder.findByUnitId).toHaveBeenCalledWith(validDto.unitId, userId);

    const command = commandBus.execute.mock.calls[0]?.[0] as CreateALeaseCommand;
    expect(command).toBeInstanceOf(CreateALeaseCommand);
    expect(command.id).toBe(validDto.id);
    expect(command.userId).toBe(userId);
    expect(command.entityId).toBe(entityId);
    expect(command.tenantId).toBe(validDto.tenantId);
    expect(command.unitId).toBe(validDto.unitId);
    expect(command.startDate).toBe(validDto.startDate);
    expect(command.rentAmountCents).toBe(63000);
    expect(command.securityDepositCents).toBe(63000);
    expect(command.monthlyDueDate).toBe(5);
    expect(command.revisionIndexType).toBe('IRL');
  });

  it('should throw UnauthorizedException when entity not owned by user', async () => {
    entityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(controller.handle(entityId, validDto, userId)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when tenant not found', async () => {
    tenantFinder.findByIdAndUser.mockResolvedValue(null);

    await expect(controller.handle(entityId, validDto, userId)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when tenant belongs to different entity', async () => {
    tenantFinder.findByIdAndUser.mockResolvedValue({
      id: validDto.tenantId,
      entityId: 'different-entity',
      userId,
    });

    await expect(controller.handle(entityId, validDto, userId)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when unit not found', async () => {
    unitFinder.findByIdAndUser.mockResolvedValue(null);

    await expect(controller.handle(entityId, validDto, userId)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw ConflictException when unit already has a lease', async () => {
    leaseFinder.findByUnitId.mockResolvedValue({
      id: 'existing-lease',
      unitId: validDto.unitId,
    });

    await expect(controller.handle(entityId, validDto, userId)).rejects.toThrow(ConflictException);
    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
