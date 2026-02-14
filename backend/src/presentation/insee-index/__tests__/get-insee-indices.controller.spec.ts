import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { GetInseeIndicesController } from '../controllers/get-insee-indices.controller';

describe('GetInseeIndicesController', () => {
  let controller: GetInseeIndicesController;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockInseeIndexFinder: { findAllByEntity: jest.Mock };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockInseeIndexFinder = { findAllByEntity: jest.fn() };
    controller = new GetInseeIndicesController(
      mockEntityFinder as never,
      mockInseeIndexFinder as never,
    );
  });

  it('should return indices for valid entity', async () => {
    const indices = [
      { id: '1', type: 'IRL', quarter: 'Q1', year: 2026, value: 142.06 },
    ];
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockInseeIndexFinder.findAllByEntity.mockResolvedValue(indices);

    const result = await controller.handle('entity-1', undefined, 'user-1');

    expect(result).toEqual({ data: indices });
    expect(mockInseeIndexFinder.findAllByEntity).toHaveBeenCalledWith(
      'entity-1', undefined,
    );
  });

  it('should pass type filter when provided', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockInseeIndexFinder.findAllByEntity.mockResolvedValue([]);

    await controller.handle('entity-1', 'IRL', 'user-1');

    expect(mockInseeIndexFinder.findAllByEntity).toHaveBeenCalledWith(
      'entity-1', 'IRL',
    );
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);
    mockInseeIndexFinder.findAllByEntity.mockResolvedValue([]);

    await expect(
      controller.handle('entity-1', undefined, 'user-1'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw BadRequestException for invalid type query', async () => {
    await expect(
      controller.handle('entity-1', 'INVALID', 'user-1'),
    ).rejects.toThrow(BadRequestException);
  });
});
