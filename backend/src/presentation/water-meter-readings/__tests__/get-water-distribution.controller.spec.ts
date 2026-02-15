import { GetWaterDistributionController } from '../controllers/get-water-distribution.controller';
import { GetWaterDistributionQuery } from '../queries/get-water-distribution.query';

describe('GetWaterDistributionController', () => {
  let controller: GetWaterDistributionController;
  let mockQueryBus: { execute: jest.Mock };

  beforeEach(() => {
    mockQueryBus = { execute: jest.fn() };
    controller = new GetWaterDistributionController(mockQueryBus as never);
  });

  it('should return distribution for valid fiscal year', async () => {
    const expected = { fiscalYear: 2025, distributions: [] };
    mockQueryBus.execute.mockResolvedValue(expected);

    const result = await controller.handle('entity-1', '2025', 'user-1');

    expect(result).toEqual({ data: expected });
    expect(mockQueryBus.execute).toHaveBeenCalledWith(expect.any(GetWaterDistributionQuery));
  });

  it('should return null when no fiscal year provided', async () => {
    const result = await controller.handle('entity-1', undefined, 'user-1');

    expect(result).toEqual({ data: null });
    expect(mockQueryBus.execute).not.toHaveBeenCalled();
  });

  it('should return null for invalid fiscal year string', async () => {
    const result = await controller.handle('entity-1', 'abc', 'user-1');

    expect(result).toEqual({ data: null });
    expect(mockQueryBus.execute).not.toHaveBeenCalled();
  });
});
