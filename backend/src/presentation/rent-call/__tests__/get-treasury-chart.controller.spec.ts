import { UnauthorizedException } from '@nestjs/common';
import { GetTreasuryChartController } from '../controllers/get-treasury-chart.controller';
import { GetTreasuryChartDto } from '../dto/get-treasury-chart.dto';

describe('GetTreasuryChartController', () => {
  let controller: GetTreasuryChartController;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockTreasuryChartFinder: { getChartData: jest.Mock };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockTreasuryChartFinder = { getChartData: jest.fn() };
    controller = new GetTreasuryChartController(
      mockEntityFinder as any,
      mockTreasuryChartFinder as any,
    );
  });

  it('should return chart data for valid entity', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockTreasuryChartFinder.getChartData.mockResolvedValue([
      { month: '2026-01', calledCents: 100000, receivedCents: 80000 },
      { month: '2026-02', calledCents: 120000, receivedCents: 120000 },
    ]);

    const result = await controller.handle(
      'entity-1',
      { months: 12 },
      'user_123',
    );

    expect(result).toEqual({
      data: [
        { month: '2026-01', calledCents: 100000, receivedCents: 80000 },
        { month: '2026-02', calledCents: 120000, receivedCents: 120000 },
      ],
    });
    expect(mockEntityFinder.findByIdAndUserId).toHaveBeenCalledWith('entity-1', 'user_123');
    expect(mockTreasuryChartFinder.getChartData).toHaveBeenCalledWith('entity-1', 'user_123', 12);
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', { months: 12 }, 'user_123'),
    ).rejects.toThrow(UnauthorizedException);

    expect(mockTreasuryChartFinder.getChartData).not.toHaveBeenCalled();
  });

  it('should pass months parameter to finder', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockTreasuryChartFinder.getChartData.mockResolvedValue([]);

    await controller.handle('entity-1', { months: 24 }, 'user_123');

    expect(mockTreasuryChartFinder.getChartData).toHaveBeenCalledWith('entity-1', 'user_123', 24);
  });

  it('should use default months value of 12 from DTO', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockTreasuryChartFinder.getChartData.mockResolvedValue([]);

    const dto = new GetTreasuryChartDto();
    await controller.handle('entity-1', dto, 'user_123');

    expect(dto.months).toBe(12);
    expect(mockTreasuryChartFinder.getChartData).toHaveBeenCalledWith('entity-1', 'user_123', 12);
  });
});
