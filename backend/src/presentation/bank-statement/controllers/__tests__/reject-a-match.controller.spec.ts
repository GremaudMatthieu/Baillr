import { UnauthorizedException } from '@nestjs/common';
import { RejectAMatchController } from '../reject-a-match.controller.js';

describe('RejectAMatchController', () => {
  let controller: RejectAMatchController;
  let entityFinder: { findByIdAndUserId: jest.Mock };

  beforeEach(() => {
    entityFinder = {
      findByIdAndUserId: jest.fn().mockResolvedValue({ id: 'entity-1' }),
    };

    controller = new RejectAMatchController(entityFinder as any);
  });

  it('should return status rejected with 200 OK', async () => {
    const result = await controller.handle('user_123', 'entity-1', {
      transactionId: 'tx-1',
    });

    expect(result).toEqual({ status: 'rejected' });
    expect(entityFinder.findByIdAndUserId).toHaveBeenCalledWith('entity-1', 'user_123');
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    entityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('user_123', 'entity-1', { transactionId: 'tx-1' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
