jest.mock('nestjs-cqrx', () => {
  const { mockCqrx } = require('./mock-cqrx');
  return mockCqrx;
});

import { RecordWaterMeterReadingsHandler } from '../commands/record-water-meter-readings.handler';
import { RecordWaterMeterReadingsCommand } from '../commands/record-water-meter-readings.command';
import { WaterMeterReadingsAggregate } from '../water-meter-readings.aggregate';

describe('RecordWaterMeterReadingsHandler', () => {
  let handler: RecordWaterMeterReadingsHandler;
  let mockRepository: {
    load: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
    };
    handler = new RecordWaterMeterReadingsHandler(mockRepository as never);
  });

  it('should load aggregate, call record, and save', async () => {
    const aggregate = new WaterMeterReadingsAggregate('entity1-2025');
    const recordSpy = jest.spyOn(aggregate, 'record');
    mockRepository.load.mockResolvedValue(aggregate);
    mockRepository.save.mockResolvedValue(undefined);

    const readings = [
      { unitId: 'unit-a', previousReading: 100, currentReading: 150, readingDate: '2025-12-15T00:00:00.000Z' },
    ];

    const command = new RecordWaterMeterReadingsCommand(
      'entity1-2025',
      'entity-1',
      'user-1',
      2025,
      readings,
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('entity1-2025');
    expect(recordSpy).toHaveBeenCalledWith('entity-1', 'user-1', 2025, readings);
    expect(mockRepository.save).toHaveBeenCalledWith(aggregate);
  });

  it('should create new aggregate when stream does not exist', async () => {
    const streamNotFoundError = new Error('StreamNotFoundError');
    (streamNotFoundError as unknown as { type: string }).type = 'stream-not-found';
    mockRepository.load.mockRejectedValue(streamNotFoundError);
    mockRepository.save.mockResolvedValue(undefined);

    const readings = [
      { unitId: 'unit-a', previousReading: 0, currentReading: 100, readingDate: '2025-12-15T00:00:00.000Z' },
    ];

    const command = new RecordWaterMeterReadingsCommand(
      'entity1-2025',
      'entity-1',
      'user-1',
      2025,
      readings,
    );

    await handler.execute(command);

    expect(mockRepository.load).toHaveBeenCalledWith('entity1-2025');
    expect(mockRepository.save).toHaveBeenCalled();
    const savedAggregate = mockRepository.save.mock.calls[0][0];
    expect(savedAggregate).toBeInstanceOf(WaterMeterReadingsAggregate);
  });

  it('should rethrow non-stream-not-found errors', async () => {
    mockRepository.load.mockRejectedValue(new Error('Connection failed'));

    const command = new RecordWaterMeterReadingsCommand(
      'entity1-2025',
      'entity-1',
      'user-1',
      2025,
      [{ unitId: 'unit-a', previousReading: 0, currentReading: 100, readingDate: '2025-12-15T00:00:00.000Z' }],
    );

    await expect(handler.execute(command)).rejects.toThrow('Connection failed');
  });
});
