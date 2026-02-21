import { UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { FetchInseeIndicesController } from '../controllers/fetch-insee-indices.controller';
import { InseeApiUnavailableException } from '@infrastructure/insee/insee-api-unavailable.exception';
import { RecordAnInseeIndexCommand } from '@indexation/insee-index/commands/record-an-insee-index.command';

jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('generated-uuid'),
}));

describe('FetchInseeIndicesController', () => {
  let controller: FetchInseeIndicesController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockInseeIndexFinder: { existsByTypeQuarterYearEntity: jest.Mock };
  let mockInseeApiService: { fetchLatestIndices: jest.Mock };

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockInseeIndexFinder = { existsByTypeQuarterYearEntity: jest.fn() };
    mockInseeApiService = { fetchLatestIndices: jest.fn() };
    controller = new FetchInseeIndicesController(
      mockCommandBus as never,
      mockEntityFinder as never,
      mockInseeIndexFinder as never,
      mockInseeApiService as never,
    );
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', 'user-1'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should fetch indices and dispatch commands for new ones', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockInseeApiService.fetchLatestIndices.mockResolvedValue([
      { type: 'IRL', quarter: 'Q4', year: 2025, value: 145.78, publishedAt: '2026-01-16' },
      { type: 'ILC', quarter: 'Q4', year: 2025, value: 134.58, publishedAt: '2026-01-22' },
    ]);
    mockInseeIndexFinder.existsByTypeQuarterYearEntity
      .mockResolvedValueOnce(false) // IRL Q4 2025 — new
      .mockResolvedValueOnce(true); // ILC Q4 2025 — exists

    const result = await controller.handle('entity-1', 'user-1');

    expect(result).toEqual({ fetched: 2, newIndices: 1, skipped: 1 });
    expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);

    const command = mockCommandBus.execute.mock.calls[0][0] as RecordAnInseeIndexCommand;
    expect(command.id).toBe('generated-uuid');
    expect(command.type).toBe('IRL');
    expect(command.quarter).toBe('Q4');
    expect(command.year).toBe(2025);
    expect(command.value).toBe(145.78);
    expect(command.entityId).toBe('entity-1');
    expect(command.userId).toBe('user-1');
    expect(command.source).toBe('auto');
  });

  it('should skip all indices if all already exist', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockInseeApiService.fetchLatestIndices.mockResolvedValue([
      { type: 'IRL', quarter: 'Q4', year: 2025, value: 145.78, publishedAt: '2026-01-16' },
    ]);
    mockInseeIndexFinder.existsByTypeQuarterYearEntity.mockResolvedValue(true);

    const result = await controller.handle('entity-1', 'user-1');

    expect(result).toEqual({ fetched: 1, newIndices: 0, skipped: 1 });
    expect(mockCommandBus.execute).not.toHaveBeenCalled();
  });

  it('should return 503 when INSEE API is unavailable', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockInseeApiService.fetchLatestIndices.mockRejectedValue(
      InseeApiUnavailableException.networkError(),
    );

    try {
      await controller.handle('entity-1', 'user-1');
      fail('Expected HttpException');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect((error as HttpException).getResponse()).toBe(
        'Le service INSEE est temporairement indisponible. Saisissez les indices manuellement.',
      );
    }
  });

  it('should rethrow non-INSEE exceptions', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockInseeApiService.fetchLatestIndices.mockRejectedValue(
      new Error('Unexpected error'),
    );

    await expect(
      controller.handle('entity-1', 'user-1'),
    ).rejects.toThrow('Unexpected error');
  });

  it('should handle empty API response', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockInseeApiService.fetchLatestIndices.mockResolvedValue([]);

    const result = await controller.handle('entity-1', 'user-1');

    expect(result).toEqual({ fetched: 0, newIndices: 0, skipped: 0 });
  });
});
