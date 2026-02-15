import { UnauthorizedException } from '@nestjs/common';
import { GetWaterMeterReadingsHandler } from '../queries/get-water-meter-readings.handler';
import { GetWaterMeterReadingsQuery } from '../queries/get-water-meter-readings.query';

describe('GetWaterMeterReadingsHandler', () => {
  let handler: GetWaterMeterReadingsHandler;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockReadingsFinder: { findByEntityAndYear: jest.Mock };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockReadingsFinder = { findByEntityAndYear: jest.fn() };
    handler = new GetWaterMeterReadingsHandler(mockEntityFinder as never, mockReadingsFinder as never);
  });

  it('should return readings for valid entity and fiscal year', async () => {
    const expected = { id: 'e1-2025', readings: [] };
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockReadingsFinder.findByEntityAndYear.mockResolvedValue(expected);

    const result = await handler.execute(new GetWaterMeterReadingsQuery('entity-1', 'user-1', 2025));

    expect(result).toEqual(expected);
    expect(mockReadingsFinder.findByEntityAndYear).toHaveBeenCalledWith('entity-1', 2025);
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      handler.execute(new GetWaterMeterReadingsQuery('entity-1', 'user-1', 2025)),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should return null when no readings exist', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockReadingsFinder.findByEntityAndYear.mockResolvedValue(null);

    const result = await handler.execute(new GetWaterMeterReadingsQuery('entity-1', 'user-1', 2025));

    expect(result).toBeNull();
  });
});
