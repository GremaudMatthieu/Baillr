import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { RegisterATenantController } from '../controllers/register-a-tenant.controller';
import { RegisterATenantCommand } from '@tenancy/tenant/commands/register-a-tenant.command';
import { EntityFinder } from '../../entity/finders/entity.finder';

describe('RegisterATenantController', () => {
  let controller: RegisterATenantController;
  let commandBus: { execute: jest.Mock<Promise<void>, [unknown]> };
  let entityFinder: { findByIdAndUserId: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined) };
    entityFinder = {
      findByIdAndUserId: jest.fn().mockResolvedValue({ id: 'entity-id', userId: 'user_clerk_123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegisterATenantController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: EntityFinder, useValue: entityFinder },
      ],
    }).compile();

    controller = module.get<RegisterATenantController>(RegisterATenantController);
  });

  it('should verify entity ownership before dispatching command', async () => {
    const entityId = '550e8400-e29b-41d4-a716-446655440001';
    const dto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'individual',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@example.com',
    };

    await controller.handle(entityId, dto, 'user_clerk_123');

    expect(entityFinder.findByIdAndUserId).toHaveBeenCalledWith(entityId, 'user_clerk_123');
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw UnauthorizedException when entity does not belong to user', async () => {
    entityFinder.findByIdAndUserId.mockResolvedValue(null);

    const dto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'individual',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@example.com',
    };

    await expect(controller.handle('entity-id', dto, 'user_clerk_123')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should dispatch RegisterATenantCommand for individual tenant', async () => {
    const entityId = '550e8400-e29b-41d4-a716-446655440001';
    const dto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'individual',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean@example.com',
      phoneNumber: '+33612345678',
      address: {
        street: '1 rue Test',
        postalCode: '75001',
        city: 'Paris',
        complement: 'Apt 3B',
      },
    };

    await controller.handle(entityId, dto, 'user_clerk_123');

    const command = commandBus.execute.mock.calls[0]?.[0] as RegisterATenantCommand;
    expect(command).toBeInstanceOf(RegisterATenantCommand);
    expect(command.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(command.userId).toBe('user_clerk_123');
    expect(command.entityId).toBe(entityId);
    expect(command.type).toBe('individual');
    expect(command.firstName).toBe('Jean');
    expect(command.lastName).toBe('Dupont');
    expect(command.companyName).toBeNull();
    expect(command.siret).toBeNull();
    expect(command.email).toBe('jean@example.com');
    expect(command.phoneNumber).toBe('+33612345678');
    expect(command.address).toEqual({
      street: '1 rue Test',
      postalCode: '75001',
      city: 'Paris',
      complement: 'Apt 3B',
    });
    expect(command.insuranceProvider).toBeNull();
    expect(command.policyNumber).toBeNull();
    expect(command.renewalDate).toBeNull();
  });

  it('should dispatch RegisterATenantCommand for company tenant', async () => {
    const dto = {
      id: '660e8400-e29b-41d4-a716-446655440001',
      type: 'company',
      firstName: 'Marie',
      lastName: 'Martin',
      companyName: 'SCI Les Oliviers',
      siret: '12345678901234',
      email: 'marie@oliviers.fr',
    };

    await controller.handle('entity-id', dto, 'user_clerk_456');

    const command = commandBus.execute.mock.calls[0]?.[0] as RegisterATenantCommand;
    expect(command.type).toBe('company');
    expect(command.companyName).toBe('SCI Les Oliviers');
    expect(command.siret).toBe('12345678901234');
  });

  it('should set nullable fields to null when not provided', async () => {
    const dto = {
      id: '770e8400-e29b-41d4-a716-446655440002',
      type: 'individual',
      firstName: 'Pierre',
      lastName: 'Durand',
      email: 'pierre@example.com',
    };

    await controller.handle('entity-id', dto, 'user_clerk_789');

    const command = commandBus.execute.mock.calls[0]?.[0] as RegisterATenantCommand;
    expect(command.companyName).toBeNull();
    expect(command.siret).toBeNull();
    expect(command.phoneNumber).toBeNull();
    expect(command.address).toEqual({
      street: null,
      postalCode: null,
      city: null,
      complement: null,
    });
    expect(command.insuranceProvider).toBeNull();
    expect(command.policyNumber).toBeNull();
    expect(command.renewalDate).toBeNull();
  });

  it('should dispatch RegisterATenantCommand with insurance fields', async () => {
    const dto = {
      id: '990e8400-e29b-41d4-a716-446655440004',
      type: 'individual',
      firstName: 'Claire',
      lastName: 'Morel',
      email: 'claire@example.com',
      insuranceProvider: 'MAIF',
      policyNumber: 'POL-2026-001',
      renewalDate: '2026-12-31T00:00:00.000Z',
    };

    await controller.handle('entity-id', dto, 'user_clerk_123');

    const command = commandBus.execute.mock.calls[0]?.[0] as RegisterATenantCommand;
    expect(command.insuranceProvider).toBe('MAIF');
    expect(command.policyNumber).toBe('POL-2026-001');
    expect(command.renewalDate).toBe('2026-12-31T00:00:00.000Z');
  });

  it('should return void (202 Accepted)', async () => {
    const dto = {
      id: '880e8400-e29b-41d4-a716-446655440003',
      type: 'individual',
      firstName: 'Luc',
      lastName: 'Bernard',
      email: 'luc@example.com',
    };

    const result = await controller.handle('entity-id', dto, 'user_clerk_123');
    expect(result).toBeUndefined();
  });
});
