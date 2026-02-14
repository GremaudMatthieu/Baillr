import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { RecordManualPaymentController } from '../controllers/record-manual-payment.controller';
import { RecordAPaymentCommand } from '@billing/rent-call/commands/record-a-payment.command';

jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(() => 'generated-uuid'),
}));

describe('RecordManualPaymentController', () => {
  let controller: RecordManualPaymentController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockRentCallFinder: { findByIdAndEntity: jest.Mock };

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockRentCallFinder = { findByIdAndEntity: jest.fn() };

    controller = new RecordManualPaymentController(
      mockCommandBus as never,
      mockEntityFinder as never,
      mockRentCallFinder as never,
    );
  });

  const userId = 'user_123';
  const entityId = 'entity-1';
  const rentCallId = 'rc-1';
  const dto = {
    amountCents: 85000,
    paymentMethod: 'cash' as const,
    paymentDate: '2026-02-14',
    payerName: 'Jean Dupont',
  };

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle(userId, entityId, rentCallId, dto),
    ).rejects.toThrow(UnauthorizedException);

    expect(mockEntityFinder.findByIdAndUserId).toHaveBeenCalledWith(entityId, userId);
    expect(mockCommandBus.execute).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when rent call not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue(null);

    await expect(
      controller.handle(userId, entityId, rentCallId, dto),
    ).rejects.toThrow(NotFoundException);

    expect(mockRentCallFinder.findByIdAndEntity).toHaveBeenCalledWith(
      rentCallId,
      entityId,
      userId,
    );
    expect(mockCommandBus.execute).not.toHaveBeenCalled();
  });

  it('should dispatch RecordAPaymentCommand with bankStatementId=null for cash payment', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue({ id: rentCallId });

    await controller.handle(userId, entityId, rentCallId, dto);

    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      new RecordAPaymentCommand(
        rentCallId,
        entityId,
        userId,
        'generated-uuid',
        null,
        85000,
        'Jean Dupont',
        '2026-02-14',
        'cash',
        null,
      ),
    );
  });

  it('should pass paymentReference for check payment', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue({ id: rentCallId });

    const checkDto = {
      ...dto,
      paymentMethod: 'check' as const,
      paymentReference: 'CHK-123456',
    };

    await controller.handle(userId, entityId, rentCallId, checkDto);

    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      new RecordAPaymentCommand(
        rentCallId,
        entityId,
        userId,
        'generated-uuid',
        null,
        85000,
        'Jean Dupont',
        '2026-02-14',
        'check',
        'CHK-123456',
      ),
    );
  });

  it('should generate server-side transactionId (UUID)', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue({ id: rentCallId });

    await controller.handle(userId, entityId, rentCallId, dto);

    const command = mockCommandBus.execute.mock.calls[0][0] as RecordAPaymentCommand;
    expect(command.transactionId).toBe('generated-uuid');
  });

  it('should still dispatch command for already-paid rent call (aggregate handles no-op)', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findByIdAndEntity.mockResolvedValue({
      id: rentCallId,
      paidAt: new Date(),
      paidAmountCents: 85000,
    });

    await controller.handle(userId, entityId, rentCallId, dto);

    expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
  });
});
