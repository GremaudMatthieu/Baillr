import { UnauthorizedException } from '@nestjs/common';
import { GetWaterDistributionHandler } from '../queries/get-water-distribution.handler';
import { GetWaterDistributionQuery } from '../queries/get-water-distribution.query';

describe('GetWaterDistributionHandler', () => {
  let handler: GetWaterDistributionHandler;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockReadingsFinder: { findByEntityAndYear: jest.Mock };
  let mockChargesFinder: { findByEntityAndYear: jest.Mock };
  let mockDistributionService: { compute: jest.Mock };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockReadingsFinder = { findByEntityAndYear: jest.fn() };
    mockChargesFinder = { findByEntityAndYear: jest.fn() };
    mockDistributionService = { compute: jest.fn() };
    handler = new GetWaterDistributionHandler(
      mockEntityFinder as never,
      mockReadingsFinder as never,
      mockChargesFinder as never,
      mockDistributionService as never,
    );
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      handler.execute(new GetWaterDistributionQuery('entity-1', 'user-1', 2025)),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should return null when no annual charges', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockChargesFinder.findByEntityAndYear.mockResolvedValue(null);

    const result = await handler.execute(new GetWaterDistributionQuery('entity-1', 'user-1', 2025));

    expect(result).toBeNull();
  });

  it('should return null when no water category in annual charges', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockChargesFinder.findByEntityAndYear.mockResolvedValue({
      charges: [{ chargeCategoryId: 'cat-electricity', label: 'Électricité', amountCents: 30000 }],
    });

    const result = await handler.execute(new GetWaterDistributionQuery('entity-1', 'user-1', 2025));

    expect(result).toBeNull();
  });

  it('should return null when no readings exist', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockChargesFinder.findByEntityAndYear.mockResolvedValue({
      charges: [{ chargeCategoryId: 'cat-water', label: 'Eau', amountCents: 60000 }],
    });
    mockReadingsFinder.findByEntityAndYear.mockResolvedValue(null);

    const result = await handler.execute(new GetWaterDistributionQuery('entity-1', 'user-1', 2025));

    expect(result).toBeNull();
  });

  it('should call distribution service with correct data', async () => {
    const waterReadings = {
      readings: [
        { unitId: 'unit-a', previousReading: 100, currentReading: 150, readingDate: '2025-12-15' },
      ],
      totalConsumption: 50,
    };
    const expectedResult = { fiscalYear: 2025, distributions: [] };

    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockChargesFinder.findByEntityAndYear.mockResolvedValue({
      charges: [{ chargeCategoryId: 'cat-water', label: 'Eau', amountCents: 60000 }],
    });
    mockReadingsFinder.findByEntityAndYear.mockResolvedValue(waterReadings);
    mockDistributionService.compute.mockReturnValue(expectedResult);

    const result = await handler.execute(new GetWaterDistributionQuery('entity-1', 'user-1', 2025));

    expect(result).toEqual(expectedResult);
    expect(mockDistributionService.compute).toHaveBeenCalledWith(waterReadings, 60000, ['unit-a']);
  });
});
