import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { CreateAnEntityController } from '../controllers/create-an-entity.controller';
import { CreateAnEntityCommand } from '@portfolio/entity/commands/create-an-entity.command';

describe('CreateAnEntityController', () => {
  let controller: CreateAnEntityController;
  let commandBus: { execute: jest.Mock<Promise<void>, [unknown]> };

  beforeEach(async () => {
    commandBus = { execute: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreateAnEntityController],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    controller = module.get<CreateAnEntityController>(CreateAnEntityController);
  });

  it('should dispatch CreateAnEntityCommand via commandBus', async () => {
    const dto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      type: 'sci' as const,
      name: 'SCI TEST',
      siret: '12345678901234',
      address: {
        street: '1 rue Test',
        postalCode: '75001',
        city: 'Paris',
        country: 'France',
        complement: null,
      },
      legalInformation: 'Capital: 1000',
    };

    await controller.handle(dto, 'user_clerk_123');

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0]?.[0] as CreateAnEntityCommand;
    expect(command).toBeInstanceOf(CreateAnEntityCommand);
    expect(command.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(command.userId).toBe('user_clerk_123');
    expect(command.type).toBe('sci');
    expect(command.name).toBe('SCI TEST');
    expect(command.siret).toBe('12345678901234');
    expect(command.address).toEqual(dto.address);
    expect(command.legalInformation).toBe('Capital: 1000');
  });

  it('should set siret and legalInformation to null when not provided', async () => {
    const dto = {
      id: '660e8400-e29b-41d4-a716-446655440001',
      type: 'nom_propre' as const,
      name: 'Jean Dupont',
      address: {
        street: '5 rue Foch',
        postalCode: '31000',
        city: 'Toulouse',
        country: 'France',
        complement: null,
      },
    };

    await controller.handle(dto, 'user_clerk_456');

    const command = commandBus.execute.mock.calls[0]?.[0] as CreateAnEntityCommand;
    expect(command.siret).toBeNull();
    expect(command.legalInformation).toBeNull();
  });

  it('should return void (201 Created)', async () => {
    const dto = {
      id: '770e8400-e29b-41d4-a716-446655440002',
      type: 'sci' as const,
      name: 'SCI Trois',
      siret: '99999999999999',
      address: {
        street: 'rue',
        postalCode: '75000',
        city: 'Paris',
        country: 'France',
        complement: null,
      },
    };

    const result = await controller.handle(dto, 'user_clerk_789');
    expect(result).toBeUndefined();
  });
});
