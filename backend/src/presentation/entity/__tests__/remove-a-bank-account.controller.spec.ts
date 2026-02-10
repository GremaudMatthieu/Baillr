import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { RemoveABankAccountController } from '../controllers/remove-a-bank-account.controller';
import { RemoveABankAccountCommand } from '@portfolio/entity/commands/remove-a-bank-account.command';

describe('RemoveABankAccountController', () => {
  let controller: RemoveABankAccountController;
  let commandBus: { execute: jest.Mock<Promise<void>, [unknown]> };

  beforeEach(async () => {
    commandBus = { execute: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RemoveABankAccountController],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    controller = module.get<RemoveABankAccountController>(RemoveABankAccountController);
  });

  it('should dispatch RemoveABankAccountCommand', async () => {
    await controller.handle('entity-uuid', 'account-uuid', 'user_clerk_123');

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0]?.[0] as RemoveABankAccountCommand;
    expect(command).toBeInstanceOf(RemoveABankAccountCommand);
    expect(command.entityId).toBe('entity-uuid');
    expect(command.userId).toBe('user_clerk_123');
    expect(command.accountId).toBe('account-uuid');
  });

  it('should return void (202 Accepted)', async () => {
    const result = await controller.handle('entity-uuid-2', 'account-uuid-2', 'user_clerk_456');
    expect(result).toBeUndefined();
  });
});
