import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { UpdateAPropertyController } from '../controllers/update-a-property.controller';
import { UpdateAPropertyCommand } from '@portfolio/property/commands/update-a-property.command';
import { PropertyFinder } from '../finders/property.finder';

describe('UpdateAPropertyController', () => {
  let controller: UpdateAPropertyController;
  let commandBus: { execute: jest.Mock<Promise<void>, [unknown]> };
  let propertyFinder: { findByIdAndUser: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined) };
    propertyFinder = {
      findByIdAndUser: jest.fn().mockResolvedValue({ id: 'prop-id', userId: 'user_clerk_123' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UpdateAPropertyController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: PropertyFinder, useValue: propertyFinder },
      ],
    }).compile();

    controller = module.get<UpdateAPropertyController>(UpdateAPropertyController);
  });

  it('should verify property ownership before dispatching command', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const dto = {
      name: 'Résidence Modifiée',
      type: 'Immeuble',
      address: {
        street: '1 rue Test',
        postalCode: '75001',
        city: 'Paris',
        country: 'France',
        complement: null,
      },
    };

    await controller.handle(id, dto, 'user_clerk_123');

    expect(propertyFinder.findByIdAndUser).toHaveBeenCalledWith(id, 'user_clerk_123');
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });

  it('should throw UnauthorizedException when property does not belong to user', async () => {
    propertyFinder.findByIdAndUser.mockResolvedValue(null);

    const dto = {
      name: 'Résidence Modifiée',
      address: {
        street: '1 rue Test',
        postalCode: '75001',
        city: 'Paris',
        country: 'France',
        complement: null,
      },
    };

    await expect(controller.handle('prop-id', dto, 'user_clerk_123')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should dispatch UpdateAPropertyCommand with all fields', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const dto = {
      name: 'Résidence Modifiée',
      type: 'Maison',
      address: {
        street: '5 avenue Foch',
        postalCode: '31000',
        city: 'Toulouse',
        country: 'France',
        complement: 'Bâtiment B',
      },
    };

    await controller.handle(id, dto, 'user_clerk_456');

    const command = commandBus.execute.mock.calls[0]?.[0] as UpdateAPropertyCommand;
    expect(command).toBeInstanceOf(UpdateAPropertyCommand);
    expect(command.id).toBe(id);
    expect(command.userId).toBe('user_clerk_456');
    expect(command.name).toBe('Résidence Modifiée');
    expect(command.type).toBe('Maison');
    expect(command.address).toEqual({
      street: '5 avenue Foch',
      postalCode: '31000',
      city: 'Toulouse',
      country: 'France',
      complement: 'Bâtiment B',
    });
  });

  it('should default country to France and complement to null when not provided', async () => {
    const dto = {
      name: 'Maison Bleue',
      type: 'Local',
      address: {
        street: '10 rue Neuve',
        postalCode: '69001',
        city: 'Lyon',
      },
    };

    await controller.handle('prop-id', dto, 'user_clerk_789');

    const command = commandBus.execute.mock.calls[0]?.[0] as UpdateAPropertyCommand;
    expect(command.address).toEqual({
      street: '10 rue Neuve',
      postalCode: '69001',
      city: 'Lyon',
      country: 'France',
      complement: null,
    });
  });

  it('should pass undefined address when not provided in dto', async () => {
    const dto = { name: 'Nouveau Nom', type: 'Immeuble' };

    await controller.handle('prop-id', dto, 'user_clerk_123');

    const command = commandBus.execute.mock.calls[0]?.[0] as UpdateAPropertyCommand;
    expect(command.name).toBe('Nouveau Nom');
    expect(command.address).toBeUndefined();
  });

  it('should return void (202 Accepted)', async () => {
    const dto = { name: 'Test', address: { street: 'r', postalCode: '75000', city: 'Paris' } };

    const result = await controller.handle('prop-id', dto, 'user_clerk_123');
    expect(result).toBeUndefined();
  });
});
