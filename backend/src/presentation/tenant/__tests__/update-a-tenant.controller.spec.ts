import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { UpdateATenantController } from '../controllers/update-a-tenant.controller';
import { UpdateATenantCommand } from '@tenancy/tenant/commands/update-a-tenant.command';
import { TenantFinder } from '../finders/tenant.finder';

describe('UpdateATenantController', () => {
  let controller: UpdateATenantController;
  let commandBus: { execute: jest.Mock<Promise<void>, [unknown]> };
  let tenantFinder: { findByIdAndUser: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined) };
    tenantFinder = {
      findByIdAndUser: jest.fn().mockResolvedValue({ id: 'tenant-id', userId: 'user_clerk_123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UpdateATenantController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: TenantFinder, useValue: tenantFinder },
      ],
    }).compile();

    controller = module.get<UpdateATenantController>(UpdateATenantController);
  });

  it('should verify tenant ownership before dispatching command', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const dto = { firstName: 'Jean-Updated' };

    await controller.handle(id, dto, 'user_clerk_123');

    expect(tenantFinder.findByIdAndUser).toHaveBeenCalledWith(id, 'user_clerk_123');
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw UnauthorizedException when tenant does not belong to user', async () => {
    tenantFinder.findByIdAndUser.mockResolvedValue(null);

    const dto = { firstName: 'Jean-Updated' };

    await expect(controller.handle('tenant-id', dto, 'user_clerk_123')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should dispatch UpdateATenantCommand with all fields', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const dto = {
      firstName: 'Marie',
      lastName: 'Martin',
      companyName: 'SCI Nouvelle',
      siret: '12345678901234',
      email: 'marie@nouvelle.fr',
      phoneNumber: '+33698765432',
      address: {
        street: '5 avenue Foch',
        postalCode: '31000',
        city: 'Toulouse',
        complement: 'Bâtiment B',
      },
    };

    await controller.handle(id, dto, 'user_clerk_456');

    const command = commandBus.execute.mock.calls[0]?.[0] as UpdateATenantCommand;
    expect(command).toBeInstanceOf(UpdateATenantCommand);
    expect(command.id).toBe(id);
    expect(command.userId).toBe('user_clerk_456');
    expect(command.firstName).toBe('Marie');
    expect(command.lastName).toBe('Martin');
    expect(command.companyName).toBe('SCI Nouvelle');
    expect(command.siret).toBe('12345678901234');
    expect(command.email).toBe('marie@nouvelle.fr');
    expect(command.phoneNumber).toBe('+33698765432');
    expect(command.address).toEqual({
      street: '5 avenue Foch',
      postalCode: '31000',
      city: 'Toulouse',
      complement: 'Bâtiment B',
    });
  });

  it('should pass undefined address when not provided in dto', async () => {
    const dto = { firstName: 'Nouveau Prénom' };

    await controller.handle('tenant-id', dto, 'user_clerk_123');

    const command = commandBus.execute.mock.calls[0]?.[0] as UpdateATenantCommand;
    expect(command.firstName).toBe('Nouveau Prénom');
    expect(command.address).toBeUndefined();
  });

  it('should handle nullable fields set to null', async () => {
    const dto = { companyName: null, siret: null, phoneNumber: null };

    await controller.handle('tenant-id', dto, 'user_clerk_123');

    const command = commandBus.execute.mock.calls[0]?.[0] as UpdateATenantCommand;
    expect(command.companyName).toBeNull();
    expect(command.siret).toBeNull();
    expect(command.phoneNumber).toBeNull();
  });

  it('should dispatch UpdateATenantCommand with insurance fields', async () => {
    const dto = {
      insuranceProvider: 'AXA',
      policyNumber: 'AXA-2026-999',
      renewalDate: '2027-03-15T00:00:00.000Z',
    };

    await controller.handle('tenant-id', dto, 'user_clerk_123');

    const command = commandBus.execute.mock.calls[0]?.[0] as UpdateATenantCommand;
    expect(command.insuranceProvider).toBe('AXA');
    expect(command.policyNumber).toBe('AXA-2026-999');
    expect(command.renewalDate).toBe('2027-03-15T00:00:00.000Z');
  });

  it('should handle insurance fields set to null', async () => {
    const dto = { insuranceProvider: null, policyNumber: null, renewalDate: null };

    await controller.handle('tenant-id', dto, 'user_clerk_123');

    const command = commandBus.execute.mock.calls[0]?.[0] as UpdateATenantCommand;
    expect(command.insuranceProvider).toBeNull();
    expect(command.policyNumber).toBeNull();
    expect(command.renewalDate).toBeNull();
  });

  it('should return void (202 Accepted)', async () => {
    const dto = { firstName: 'Test' };

    const result = await controller.handle('tenant-id', dto, 'user_clerk_123');
    expect(result).toBeUndefined();
  });
});
