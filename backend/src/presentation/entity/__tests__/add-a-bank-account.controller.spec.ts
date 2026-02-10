import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { AddABankAccountController } from '../controllers/add-a-bank-account.controller';
import { AddABankAccountCommand } from '@portfolio/entity/commands/add-a-bank-account.command';

describe('AddABankAccountController', () => {
  let controller: AddABankAccountController;
  let commandBus: { execute: jest.Mock<Promise<void>, [unknown]> };

  beforeEach(async () => {
    commandBus = { execute: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddABankAccountController],
      providers: [{ provide: CommandBus, useValue: commandBus }],
    }).compile();

    controller = module.get<AddABankAccountController>(AddABankAccountController);
  });

  it('should dispatch AddABankAccountCommand with all fields', async () => {
    const dto = {
      accountId: '550e8400-e29b-41d4-a716-446655440000',
      type: 'bank_account' as const,
      label: 'Compte LCL',
      iban: 'FR7630002005500000157845Z02',
      bic: 'CRLYFRPP',
      bankName: 'LCL',
      isDefault: true,
    };

    await controller.handle('entity-uuid', dto, 'user_clerk_123');

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const command = commandBus.execute.mock.calls[0]?.[0] as AddABankAccountCommand;
    expect(command).toBeInstanceOf(AddABankAccountCommand);
    expect(command.entityId).toBe('entity-uuid');
    expect(command.userId).toBe('user_clerk_123');
    expect(command.accountId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(command.type).toBe('bank_account');
    expect(command.label).toBe('Compte LCL');
    expect(command.iban).toBe('FR7630002005500000157845Z02');
    expect(command.bic).toBe('CRLYFRPP');
    expect(command.bankName).toBe('LCL');
    expect(command.isDefault).toBe(true);
  });

  it('should pass null for optional fields when not provided', async () => {
    const dto = {
      accountId: '660e8400-e29b-41d4-a716-446655440001',
      type: 'cash_register' as const,
      label: 'Caisse principale',
      isDefault: false,
    };

    await controller.handle('entity-uuid-2', dto, 'user_clerk_456');

    const command = commandBus.execute.mock.calls[0]?.[0] as AddABankAccountCommand;
    expect(command.iban).toBeNull();
    expect(command.bic).toBeNull();
    expect(command.bankName).toBeNull();
    expect(command.isDefault).toBe(false);
  });

  it('should return void (202 Accepted)', async () => {
    const dto = {
      accountId: '770e8400-e29b-41d4-a716-446655440002',
      type: 'bank_account' as const,
      label: 'Compte',
      iban: 'FR7630002005500000157845Z02',
      isDefault: false,
    };

    const result = await controller.handle('entity-uuid-3', dto, 'user_clerk_789');
    expect(result).toBeUndefined();
  });
});
