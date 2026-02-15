import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ValidateAMatchController } from '../validate-a-match.controller.js';
import { RecordAPaymentCommand } from '@billing/rent-call/commands/record-a-payment.command';

describe('ValidateAMatchController', () => {
  let controller: ValidateAMatchController;
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

    controller = new ValidateAMatchController(
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

    expect(entityFinder.findByIdAndUserId).toHaveBeenCalledWith('entity-1', 'user_123');
    expect(rentCallFinder.findByIdAndEntity).toHaveBeenCalledWith('rc-1', 'entity-1', 'user_123');
    expect(commandBus.execute).toHaveBeenCalledWith(expect.any(RecordAPaymentCommand));

    const cmd = commandBus.execute.mock.calls[0][0] as RecordAPaymentCommand;
    expect(cmd.rentCallId).toBe('rc-1');
    expect(cmd.entityId).toBe('entity-1');
    expect(cmd.userId).toBe('user_123');
    expect(cmd.transactionId).toBe('tx-1');
    expect(cmd.amountCents).toBe(85000);
    expect(cmd.payerName).toBe('DOS SANTOS');
    expect(cmd.paymentDate).toBe('2026-02-10');
    expect(cmd.bankStatementId).toBeNull();
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    entityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(controller.handle('user_123', 'entity-1', dto)).rejects.toThrow(
      UnauthorizedException,
    );

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when rent call does not belong to entity', async () => {
    rentCallFinder.findByIdAndEntity.mockResolvedValue(null);

    await expect(controller.handle('user_123', 'entity-1', dto)).rejects.toThrow(NotFoundException);

    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('should pass bankStatementId as null when not provided', async () => {
    await controller.handle('user_123', 'entity-1', dto);

    const cmd = commandBus.execute.mock.calls[0][0] as RecordAPaymentCommand;
    expect(cmd.bankStatementId).toBeNull();
  });

  it('should pass bankStatementId when provided', async () => {
    const dtoWithBs = { ...dto, bankStatementId: 'bs-1' };
    await controller.handle('user_123', 'entity-1', dtoWithBs);

    const cmd = commandBus.execute.mock.calls[0][0] as RecordAPaymentCommand;
    expect(cmd.bankStatementId).toBe('bs-1');
  });
});
