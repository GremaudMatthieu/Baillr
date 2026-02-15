import { UnauthorizedException } from '@nestjs/common';
import { GetInseeIndicesHandler } from '../queries/get-insee-indices.handler';
import { GetInseeIndicesQuery } from '../queries/get-insee-indices.query';

describe('GetInseeIndicesHandler', () => {
  let handler: GetInseeIndicesHandler;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockInseeIndexFinder: { findAllByEntity: jest.Mock };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockInseeIndexFinder = { findAllByEntity: jest.fn() };
    handler = new GetInseeIndicesHandler(mockEntityFinder as never, mockInseeIndexFinder as never);
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(handler.execute(new GetInseeIndicesQuery('entity-1', 'user-1'))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should return indices for valid entity', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    const indices = [{ id: '1', type: 'IRL', quarter: 'Q1', year: 2026, value: 142.06 }];
    mockInseeIndexFinder.findAllByEntity.mockResolvedValue(indices);

    const result = await handler.execute(new GetInseeIndicesQuery('entity-1', 'user-1'));

    expect(result).toEqual(indices);
    expect(mockInseeIndexFinder.findAllByEntity).toHaveBeenCalledWith('entity-1', undefined);
  });

  it('should pass type filter when provided', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockInseeIndexFinder.findAllByEntity.mockResolvedValue([]);

    await handler.execute(new GetInseeIndicesQuery('entity-1', 'user-1', 'IRL'));

    expect(mockInseeIndexFinder.findAllByEntity).toHaveBeenCalledWith('entity-1', 'IRL');
  });
});
