import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ManualAssignAMatchController } from '../manual-assign-a-match.controller.js';
import { RecordAPaymentCommand } from '@billing/rent-call/commands/record-a-payment.command';

describe('ManualAssignAMatchController', () => {
  let controller: ManualAssignAMatchController;
  let commandBus: { execute: jest.Mock };
  let entityFinder: { findByIdAndUserId: jest.Mock };
  let rentCallFinder: { findByIdAndEntity: jest.Mock };

  beforeEach(() => {
    commandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    entityFinder = {
      findByIdAndUserId: jest.fn().mockResolvedValue({ id: 'entity-1' }),
    };
    rentCallFinder = {
      findByIdAndEntity: jest.fn().mockResolvedValue({ id: 'rc-1', entityId: 'entity-1' }),
    };

    controller = new ManualAssignAMatchController(
      commandBus as any,
      entityFinder as any,
      rentCallFinder as any,
    );
  });

  const dto = {
    transactionId: 'tx-1',
    rentCallId: 'rc-1',
    amountCents: 85000,
    payerName: 'DOS SANTOS',
    paymentDate: '2026-02-10',
  };

  it('should dispatch RecordAPaymentCommand and return 202', async () => {
    await controller.handle('user_123', 'entity-1', dto);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(RecordAPaymentCommand),
    );

    const cmd = commandBus.execute.mock.calls[0][0] as RecordAPaymentCommand;
    expect(cmd.rentCallId).toBe('rc-1');
    expect(cmd.entityId).toBe('entity-1');
    expect(cmd.transactionId).toBe('tx-1');
    expect(cmd.bankStatementId).toBeNull();
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    entityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('user_123', 'entity-1', dto),
    ).rejects.toThrow(UnauthorizedException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when rent call does not belong to entity', async () => {
    rentCallFinder.findByIdAndEntity.mockResolvedValue(null);

    await expect(
      controller.handle('user_123', 'entity-1', dto),
    ).rejects.toThrow(NotFoundException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
