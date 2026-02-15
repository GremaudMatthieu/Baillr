import { UnauthorizedException } from '@nestjs/common';
import { GetRevisionsHandler } from '../queries/get-revisions.handler';
import { GetRevisionsQuery } from '../queries/get-revisions.query';

describe('GetRevisionsHandler', () => {
  let handler: GetRevisionsHandler;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockRevisionFinder: { findAllByEntity: jest.Mock };

  const revisions = [
    {
      id: 'rev-1',
      leaseId: 'lease-1',
      entityId: 'entity-1',
      tenantName: 'Dupont Jean',
      currentRentCents: 75000,
      newRentCents: 77097,
      status: 'pending',
    },
  ];

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockRevisionFinder = { findAllByEntity: jest.fn() };
    handler = new GetRevisionsHandler(mockEntityFinder as never, mockRevisionFinder as never);
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(handler.execute(new GetRevisionsQuery('entity-1', 'user-1'))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should return revisions for valid entity', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockRevisionFinder.findAllByEntity.mockResolvedValue(revisions);

    const result = await handler.execute(new GetRevisionsQuery('entity-1', 'user-1'));

    expect(result).toEqual(revisions);
    expect(mockRevisionFinder.findAllByEntity).toHaveBeenCalledWith('entity-1');
  });
});
