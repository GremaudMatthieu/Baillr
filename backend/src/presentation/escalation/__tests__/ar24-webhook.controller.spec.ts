import { ForbiddenException } from '@nestjs/common';
import { Ar24WebhookController } from '../controllers/ar24-webhook.controller';
import type { Ar24WebhookDto } from '../dto/ar24-webhook.dto';

describe('Ar24WebhookController', () => {
  let controller: Ar24WebhookController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEscalationFinder: { findByRegisteredMailTrackingId: jest.Mock };

  const mockReq = (ip = '185.183.140.195') =>
    ({
      ip,
      socket: { remoteAddress: ip },
    }) as never;

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockEscalationFinder = { findByRegisteredMailTrackingId: jest.fn() };
    controller = new Ar24WebhookController(
      mockCommandBus as never,
      mockEscalationFinder as never,
    );
  });

  it('should process valid webhook and dispatch command', async () => {
    mockEscalationFinder.findByRegisteredMailTrackingId.mockResolvedValue({
      rentCallId: 'rc-1',
    });

    const payload: Ar24WebhookDto = {
      id_mail: 'mail-123',
      new_state: 'AR',
      proof_url: 'https://ar24.fr/proof/123',
    };

    const result = await controller.handle(payload, mockReq());

    expect(result).toEqual({ received: true });
    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        rentCallId: 'rc-1',
        status: 'AR',
        proofUrl: 'https://ar24.fr/proof/123',
      }),
    );
  });

  it('should return received: true when escalation not found', async () => {
    mockEscalationFinder.findByRegisteredMailTrackingId.mockResolvedValue(null);

    const payload: Ar24WebhookDto = {
      id_mail: 'unknown-mail',
      new_state: 'sent',
    };

    const result = await controller.handle(payload, mockReq());

    expect(result).toEqual({ received: true });
    expect(mockCommandBus.execute).not.toHaveBeenCalled();
  });

  it('should handle webhook without proof_url', async () => {
    mockEscalationFinder.findByRegisteredMailTrackingId.mockResolvedValue({
      rentCallId: 'rc-1',
    });

    const payload: Ar24WebhookDto = {
      id_mail: 'mail-123',
      new_state: 'waiting',
    };

    const result = await controller.handle(payload, mockReq());

    expect(result).toEqual({ received: true });
    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        proofUrl: null,
      }),
    );
  });

  it('should reject unauthorized IP in non-test environment', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const payload: Ar24WebhookDto = {
        id_mail: 'mail-123',
        new_state: 'AR',
      };

      await expect(
        controller.handle(payload, mockReq('192.168.1.1')),
      ).rejects.toThrow(ForbiddenException);
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('should handle IPv6-mapped IPv4 addresses', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      mockEscalationFinder.findByRegisteredMailTrackingId.mockResolvedValue({
        rentCallId: 'rc-1',
      });

      const payload: Ar24WebhookDto = {
        id_mail: 'mail-123',
        new_state: 'sent',
      };

      const result = await controller.handle(
        payload,
        mockReq('::ffff:185.183.140.195'),
      );

      expect(result).toEqual({ received: true });
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
