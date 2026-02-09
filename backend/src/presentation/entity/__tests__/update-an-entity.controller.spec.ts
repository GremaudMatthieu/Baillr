import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { UpdateAnEntityController } from '../controllers/update-an-entity.controller';
import { UpdateAnEntityCommand } from '../../../portfolio/entity/commands/update-an-entity.command';

describe('UpdateAnEntityController', () => {
  let controller: UpdateAnEntityController;
  let commandBus: { execute: jest.Mock<Promise<void>, [unknown]> };

  beforeEach(async () => {
    commandBus = { execute: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UpdateAnEntityController],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    controller = module.get<UpdateAnEntityController>(UpdateAnEntityController);
  });

  it('should dispatch UpdateAnEntityCommand via commandBus', async () => {
    const dto = {
      name: 'Updated Name',
      siret: '11111111111111',
      address: {
        street: '10 rue Neuve',
        postalCode: '69000',
        city: 'Lyon',
        country: 'France',
        complement: null,
      },
      legalInformation: 'Nouvelles infos',
    };

    await controller.handle('550e8400-e29b-41d4-a716-446655440000', dto, 'user_clerk_123');

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0]?.[0] as UpdateAnEntityCommand;
    expect(command).toBeInstanceOf(UpdateAnEntityCommand);
    expect(command.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(command.userId).toBe('user_clerk_123');
    expect(command.name).toBe('Updated Name');
  });

  it('should handle partial updates', async () => {
    const dto = { name: 'Only Name Updated' };

    await controller.handle('660e8400-e29b-41d4-a716-446655440001', dto, 'user_clerk_456');

    const command = commandBus.execute.mock.calls[0]?.[0] as UpdateAnEntityCommand;
    expect(command.name).toBe('Only Name Updated');
    expect(command.siret).toBeUndefined();
    expect(command.address).toBeUndefined();
  });

  it('should return void (200 OK)', async () => {
    const dto = { name: 'Test' };

    const result = await controller.handle(
      '770e8400-e29b-41d4-a716-446655440002',
      dto,
      'user_clerk_789',
    );
    expect(result).toBeUndefined();
  });

  it('should throw UnauthorizedException when userId is missing', async () => {
    const dto = { name: 'Test' };

    await expect(
      controller.handle(
        '880e8400-e29b-41d4-a716-446655440003',
        dto,
        undefined as unknown as string,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });
});
