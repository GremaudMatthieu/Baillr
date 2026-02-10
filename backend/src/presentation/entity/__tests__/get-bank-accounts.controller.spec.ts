import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { GetBankAccountsController } from '../controllers/get-bank-accounts.controller';
import { GetBankAccountsQuery } from '../queries/get-bank-accounts.query';

describe('GetBankAccountsController', () => {
  let controller: GetBankAccountsController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, [unknown]> };

  beforeEach(async () => {
    queryBus = { execute: jest.fn<Promise<unknown>, [unknown]>() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetBankAccountsController],
      providers: [{ provide: QueryBus, useValue: queryBus }],
    }).compile();

    controller = module.get<GetBankAccountsController>(GetBankAccountsController);
  });

  it('should dispatch GetBankAccountsQuery and return wrapped data', async () => {
    const accounts = [
      { id: 'a1', label: 'Compte LCL', type: 'bank_account', isDefault: true },
      { id: 'a2', label: 'Caisse', type: 'cash_register', isDefault: false },
    ];
    queryBus.execute.mockResolvedValue(accounts);

    const result = await controller.handle('entity-uuid', 'user_clerk_123');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetBankAccountsQuery;
    expect(query).toBeInstanceOf(GetBankAccountsQuery);
    expect(query.entityId).toBe('entity-uuid');
    expect(query.userId).toBe('user_clerk_123');
    expect(result).toEqual({ data: accounts });
  });

  it('should return empty array when no bank accounts', async () => {
    queryBus.execute.mockResolvedValue([]);

    const result = await controller.handle('entity-uuid-2', 'user_clerk_new');

    expect(result).toEqual({ data: [] });
  });
});
