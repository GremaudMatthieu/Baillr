import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ConfigureLatePaymentDelayController } from '../controllers/configure-late-payment-delay.controller';
import { ConfigureLatePaymentDelayCommand } from '@portfolio/entity/commands/configure-late-payment-delay.command';

describe('ConfigureLatePaymentDelayController', () => {
  let controller: ConfigureLatePaymentDelayController;
  let commandBus: { execute: jest.Mock<Promise<void>, [unknown]> };

  beforeEach(async () => {
    commandBus = { execute: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigureLatePaymentDelayController],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    controller = module.get<ConfigureLatePaymentDelayController>(
      ConfigureLatePaymentDelayController,
    );
  });

  it('should dispatch ConfigureLatePaymentDelayCommand via commandBus', async () => {
    const dto = { days: 10 };

    await controller.handle('550e8400-e29b-41d4-a716-446655440000', dto, 'user_clerk_123');

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0]?.[0] as ConfigureLatePaymentDelayCommand;
    expect(command).toBeInstanceOf(ConfigureLatePaymentDelayCommand);
    expect(command.entityId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(command.userId).toBe('user_clerk_123');
    expect(command.days).toBe(10);
  });

  it('should return void (200 OK)', async () => {
    const dto = { days: 0 };

    const result = await controller.handle(
      '770e8400-e29b-41d4-a716-446655440002',
      dto,
      'user_clerk_789',
    );
    expect(result).toBeUndefined();
  });
});
