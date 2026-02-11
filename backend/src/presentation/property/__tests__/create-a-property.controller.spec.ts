import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { CreateAPropertyController } from '../controllers/create-a-property.controller';
import { CreateAPropertyCommand } from '@portfolio/property/commands/create-a-property.command';
import { EntityFinder } from '../../entity/finders/entity.finder';

describe('CreateAPropertyController', () => {
  let controller: CreateAPropertyController;
  let commandBus: { execute: jest.Mock<Promise<void>, [unknown]> };
  let entityFinder: { findByIdAndUserId: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined) };
    entityFinder = {
      findByIdAndUserId: jest.fn().mockResolvedValue({ id: 'entity-id', userId: 'user_clerk_123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateAPropertyController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: EntityFinder, useValue: entityFinder },
      ],
    }).compile();

    controller = module.get<CreateAPropertyController>(CreateAPropertyController);
  });

  it('should verify entity ownership before dispatching command', async () => {
    const entityId = '550e8400-e29b-41d4-a716-446655440001';
    const dto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Résidence Les Oliviers',
      type: 'Immeuble',
      address: {
        street: '1 rue Test',
        postalCode: '75001',
        city: 'Paris',
        country: 'France',
        complement: null,
      },
    };

    await controller.handle(entityId, dto, 'user_clerk_123');

    expect(entityFinder.findByIdAndUserId).toHaveBeenCalledWith(entityId, 'user_clerk_123');
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw UnauthorizedException when entity does not belong to user', async () => {
    entityFinder.findByIdAndUserId.mockResolvedValue(null);

    const dto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Résidence Les Oliviers',
      address: {
        street: '1 rue Test',
        postalCode: '75001',
        city: 'Paris',
        country: 'France',
        complement: null,
      },
    };

    await expect(controller.handle('entity-id', dto, 'user_clerk_123')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should dispatch CreateAPropertyCommand via commandBus', async () => {
    const entityId = '550e8400-e29b-41d4-a716-446655440001';
    const dto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Résidence Les Oliviers',
      type: 'Immeuble',
      address: {
        street: '1 rue Test',
        postalCode: '75001',
        city: 'Paris',
        country: 'France',
        complement: null,
      },
    };

    await controller.handle(entityId, dto, 'user_clerk_123');

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0]?.[0] as CreateAPropertyCommand;
    expect(command).toBeInstanceOf(CreateAPropertyCommand);
    expect(command.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(command.userId).toBe('user_clerk_123');
    expect(command.entityId).toBe(entityId);
    expect(command.name).toBe('Résidence Les Oliviers');
    expect(command.type).toBe('Immeuble');
    expect(command.address).toEqual({
      street: '1 rue Test',
      postalCode: '75001',
      city: 'Paris',
      country: 'France',
      complement: null,
    });
  });

  it('should set type to null when not provided', async () => {
    const dto = {
      id: '660e8400-e29b-41d4-a716-446655440001',
      name: 'Maison Bleue',
      address: {
        street: '5 rue Foch',
        postalCode: '31000',
        city: 'Toulouse',
        country: 'France',
        complement: null,
      },
    };

    await controller.handle('entity-id', dto, 'user_clerk_456');

    const command = commandBus.execute.mock.calls[0]?.[0] as CreateAPropertyCommand;
    expect(command.type).toBeNull();
  });

  it('should return void (202 Accepted)', async () => {
    const dto = {
      id: '770e8400-e29b-41d4-a716-446655440002',
      name: 'Immeuble Trois',
      address: {
        street: 'rue',
        postalCode: '75000',
        city: 'Paris',
        country: 'France',
        complement: null,
      },
    };

    const result = await controller.handle('entity-id', dto, 'user_clerk_789');
    expect(result).toBeUndefined();
  });
});
