import { UnauthorizedException } from '@nestjs/common';
import { GetRevisionsController } from '../controllers/get-revisions.controller';

describe('GetRevisionsController', () => {
  let controller: GetRevisionsController;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockRevisionFinder: { findAllByEntity: jest.Mock };

  const revisions = [
    {
      id: 'rev-1',
      leaseId: 'lease-1',
      entityId: 'entity-1',
      tenantName: 'Dupont Jean',
      unitLabel: 'Apt A',
      currentRentCents: 75000,
      newRentCents: 77097,
      differenceCents: 2097,
      status: 'pending',
    },
  ];

  beforeEach(() => {
    mockEntityFinder = {
      findByIdAndUserId: jest.fn().mockResolvedValue({ id: 'entity-1' }),
    };
    mockRevisionFinder = {
      findAllByEntity: jest.fn().mockResolvedValue(revisions),
    };
    controller = new GetRevisionsController(
      mockEntityFinder as never,
      mockRevisionFinder as never,
    );
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);
    await expect(controller.handle('entity-1', 'user-1')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should return revisions for entity', async () => {
    const result = await controller.handle('entity-1', 'user-1');
    expect(result.data).toEqual(revisions);
    expect(mockRevisionFinder.findAllByEntity).toHaveBeenCalledWith(
      'entity-1',
    );
  });
});
