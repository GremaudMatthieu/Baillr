import { GetWaterMeterReadingsController } from '../controllers/get-water-meter-readings.controller';
import { GetWaterMeterReadingsQuery } from '../queries/get-water-meter-readings.query';

describe('GetWaterMeterReadingsController', () => {
  let controller: GetWaterMeterReadingsController;
  let mockQueryBus: { execute: jest.Mock };

  beforeEach(() => {
    mockQueryBus = { execute: jest.fn() };
    controller = new GetWaterMeterReadingsController(mockQueryBus as never);
  });

  it('should return data for valid fiscal year', async () => {
    const expected = { id: 'e1-2025', readings: [] };
    mockQueryBus.execute.mockResolvedValue(expected);

    const result = await controller.handle('entity-1', '2025', 'user-1');

    expect(result).toEqual({ data: expected });
    expect(mockQueryBus.execute).toHaveBeenCalledWith(expect.any(GetWaterMeterReadingsQuery));
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
