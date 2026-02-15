import { UnauthorizedException } from '@nestjs/common';
import { RecordWaterMeterReadingsController } from '../controllers/record-water-meter-readings.controller';
import { RecordWaterMeterReadingsCommand } from '@indexation/water-meter-readings/commands/record-water-meter-readings.command';

describe('RecordWaterMeterReadingsController', () => {
  let controller: RecordWaterMeterReadingsController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    controller = new RecordWaterMeterReadingsController(
      mockCommandBus as never,
      mockEntityFinder as never,
    );
  });

  const validDto = {
    id: 'entity1-2025',
    fiscalYear: 2025,
    readings: [
      { unitId: 'unit-a', previousReading: 100, currentReading: 150, readingDate: '2025-12-15T00:00:00.000Z' },
    ],
  };

  it('should dispatch command with valid data and return 202', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });

    await controller.handle('entity-1', validDto as never, 'user-1');

    expect(mockCommandBus.execute).toHaveBeenCalledWith(expect.any(RecordWaterMeterReadingsCommand));
    const command = mockCommandBus.execute.mock.calls[0][0] as RecordWaterMeterReadingsCommand;
    expect(command.id).toBe('entity1-2025');
    expect(command.entityId).toBe('entity-1');
    expect(command.userId).toBe('user-1');
    expect(command.fiscalYear).toBe(2025);
    expect(command.readings).toHaveLength(1);
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(controller.handle('entity-1', validDto as never, 'user-1')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should check entity ownership with userId', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });

    await controller.handle('entity-1', validDto as never, 'user-1');

    expect(mockEntityFinder.findByIdAndUserId).toHaveBeenCalledWith('entity-1', 'user-1');
  });
});
