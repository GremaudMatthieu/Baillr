import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { RecordAnInseeIndexController } from '../controllers/record-an-insee-index.controller';
import { RecordAnInseeIndexCommand } from '@indexation/insee-index/commands/record-an-insee-index.command';

describe('RecordAnInseeIndexController', () => {
  let controller: RecordAnInseeIndexController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockInseeIndexFinder: { existsByTypeQuarterYearEntity: jest.Mock };

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockInseeIndexFinder = { existsByTypeQuarterYearEntity: jest.fn() };
    controller = new RecordAnInseeIndexController(
      mockCommandBus as never,
      mockEntityFinder as never,
      mockInseeIndexFinder as never,
    );
  });

  it('should dispatch command with valid data', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockInseeIndexFinder.existsByTypeQuarterYearEntity.mockResolvedValue(false);

    await controller.handle(
      'entity-1',
      {
        id: 'test-id',
        type: 'IRL',
        quarter: 'Q1',
        year: 2026,
        value: 142.06,
      },
      'user-1',
    );

    expect(mockCommandBus.execute).toHaveBeenCalledWith(expect.any(RecordAnInseeIndexCommand));
    const command = mockCommandBus.execute.mock.calls[0][0] as RecordAnInseeIndexCommand;
    expect(command.id).toBe('test-id');
    expect(command.type).toBe('IRL');
    expect(command.quarter).toBe('Q1');
    expect(command.year).toBe(2026);
    expect(command.value).toBe(142.06);
    expect(command.entityId).toBe('entity-1');
    expect(command.userId).toBe('user-1');
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);
    mockInseeIndexFinder.existsByTypeQuarterYearEntity.mockResolvedValue(false);

    await expect(
      controller.handle(
        'entity-1',
        {
          id: 'test-id',
          type: 'IRL',
          quarter: 'Q1',
          year: 2026,
          value: 142.06,
        },
        'user-1',
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw ConflictException if duplicate index exists', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockInseeIndexFinder.existsByTypeQuarterYearEntity.mockResolvedValue(true);

    await expect(
      controller.handle(
        'entity-1',
        {
          id: 'test-id',
          type: 'IRL',
          quarter: 'Q1',
          year: 2026,
          value: 142.06,
        },
        'user-1',
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should check entity and duplicate in parallel', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockInseeIndexFinder.existsByTypeQuarterYearEntity.mockResolvedValue(false);

    await controller.handle(
      'entity-1',
      {
        id: 'test-id',
        type: 'IRL',
        quarter: 'Q1',
        year: 2026,
        value: 142.06,
      },
      'user-1',
    );

    expect(mockEntityFinder.findByIdAndUserId).toHaveBeenCalledWith('entity-1', 'user-1');
    expect(mockInseeIndexFinder.existsByTypeQuarterYearEntity).toHaveBeenCalledWith(
      'IRL',
      'Q1',
      2026,
      'entity-1',
    );
  });
});
