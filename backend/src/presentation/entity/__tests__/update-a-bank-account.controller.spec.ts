import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { UpdateABankAccountController } from '../controllers/update-a-bank-account.controller';
import { UpdateABankAccountCommand } from '@portfolio/entity/commands/update-a-bank-account.command';

describe('UpdateABankAccountController', () => {
  let controller: UpdateABankAccountController;
  let commandBus: { execute: jest.Mock<Promise<void>, [unknown]> };

  beforeEach(async () => {
    commandBus = { execute: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UpdateABankAccountController],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    controller = module.get<UpdateABankAccountController>(UpdateABankAccountController);
  });

  it('should dispatch UpdateABankAccountCommand with all fields', async () => {
    const dto = {
      label: 'Nouveau libellé',
      iban: 'DE89370400440532013000',
      bic: 'COBADEFFXXX',
      bankName: 'Commerzbank',
      isDefault: true,
    };

    await controller.handle('entity-uuid', 'account-uuid', dto, 'user_clerk_123');

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0]?.[0] as UpdateABankAccountCommand;
    expect(command).toBeInstanceOf(UpdateABankAccountCommand);
    expect(command.entityId).toBe('entity-uuid');
    expect(command.userId).toBe('user_clerk_123');
    expect(command.accountId).toBe('account-uuid');
    expect(command.label).toBe('Nouveau libellé');
    expect(command.iban).toBe('DE89370400440532013000');
    expect(command.bic).toBe('COBADEFFXXX');
    expect(command.bankName).toBe('Commerzbank');
    expect(command.isDefault).toBe(true);
  });

  it('should pass undefined for optional fields when not provided', async () => {
    const dto = {
      label: 'Mis à jour',
    };

    await controller.handle('entity-uuid-2', 'account-uuid-2', dto, 'user_clerk_456');

    const command = commandBus.execute.mock.calls[0]?.[0] as UpdateABankAccountCommand;
    expect(command.label).toBe('Mis à jour');
    expect(command.iban).toBeUndefined();
    expect(command.bic).toBeUndefined();
    expect(command.bankName).toBeUndefined();
    expect(command.isDefault).toBeUndefined();
  });

  it('should return void (202 Accepted)', async () => {
    const dto = { label: 'Test' };

    const result = await controller.handle(
      'entity-uuid-3',
      'account-uuid-3',
      dto,
      'user_clerk_789',
    );
    expect(result).toBeUndefined();
  });
});
