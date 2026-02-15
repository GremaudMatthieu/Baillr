import { UnauthorizedException } from '@nestjs/common';
import { SendRentCallsByEmailController } from '../controllers/send-rent-calls-by-email.controller';
import { SendRentCallsByEmailCommand } from '@billing/rent-call/commands/send-rent-calls-by-email.command';
import type { SendResult } from '@billing/rent-call/commands/send-rent-calls-by-email.command';

describe('SendRentCallsByEmailController', () => {
  let controller: SendRentCallsByEmailController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockRentCallFinder: { findUnsentByEntityAndMonth: jest.Mock };

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn() };
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockRentCallFinder = { findUnsentByEntityAndMonth: jest.fn() };

    controller = new SendRentCallsByEmailController(
      mockCommandBus as any,
      mockEntityFinder as any,
      mockRentCallFinder as any,
    );
  });

  const entityId = 'entity-1';
  const userId = 'user_123';
  const month = '2026-02';

  it('should orchestrate finders and dispatch command with unsent rent calls', async () => {
    const unsentRentCalls = [{ id: 'rc-1', tenant: { email: 'test@example.com' } }];
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findUnsentByEntityAndMonth.mockResolvedValue(unsentRentCalls);

    const handlerResult: SendResult = { sent: 1, failed: 0, totalAmountCents: 85000, failures: [] };
    mockCommandBus.execute.mockResolvedValue(handlerResult);

    const result = await controller.handle(entityId, { month }, userId);

    expect(result).toEqual(handlerResult);
    expect(mockEntityFinder.findByIdAndUserId).toHaveBeenCalledWith(entityId, userId);
    expect(mockRentCallFinder.findUnsentByEntityAndMonth).toHaveBeenCalledWith(
      entityId,
      userId,
      month,
    );

    const command = mockCommandBus.execute.mock.calls[0][0];
    expect(command).toBeInstanceOf(SendRentCallsByEmailCommand);
    expect(command.entityId).toBe(entityId);
    expect(command.month).toBe(month);
    expect(command.userId).toBe(userId);
    expect(command.unsentRentCalls).toBe(unsentRentCalls);
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);
    mockRentCallFinder.findUnsentByEntityAndMonth.mockResolvedValue([]);

    await expect(controller.handle(entityId, { month }, userId)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should dispatch empty array when no unsent rent calls', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findUnsentByEntityAndMonth.mockResolvedValue([]);
    mockCommandBus.execute.mockResolvedValue({
      sent: 0,
      failed: 0,
      totalAmountCents: 0,
      failures: [],
    });

    await controller.handle(entityId, { month }, userId);

    const command = mockCommandBus.execute.mock.calls[0][0];
    expect(command.unsentRentCalls).toEqual([]);
  });

  it('should propagate handler errors', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: entityId });
    mockRentCallFinder.findUnsentByEntityAndMonth.mockResolvedValue([]);
    mockCommandBus.execute.mockRejectedValue(new Error('Handler error'));

    await expect(controller.handle(entityId, { month }, userId)).rejects.toThrow('Handler error');
  });
});
