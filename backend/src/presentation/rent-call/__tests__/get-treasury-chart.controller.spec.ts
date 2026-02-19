import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetTreasuryChartController } from '../controllers/get-treasury-chart.controller';
import { EntityFinder } from '../../entity/finders/entity.finder';
import { GetTreasuryChartDto } from '../dto/get-treasury-chart.dto';
import { GetTreasuryChartQuery } from '../queries/get-treasury-chart.query';

describe('GetTreasuryChartController', () => {
  let controller: GetTreasuryChartController;
  let entityFinder: { findByIdAndUserId: jest.Mock };
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    entityFinder = { findByIdAndUserId: jest.fn() };
    queryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetTreasuryChartController],
      providers: [
        { provide: EntityFinder, useValue: entityFinder },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    controller = module.get<GetTreasuryChartController>(GetTreasuryChartController);
  });

  it('should return chart data for valid entity', async () => {
    entityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    queryBus.execute.mockResolvedValue([
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
    expect(entityFinder.findByIdAndUserId).toHaveBeenCalledWith('entity-1', 'user_123');
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(GetTreasuryChartQuery),
    );
    const query = queryBus.execute.mock.calls[0][0];
    expect(query.entityId).toBe('entity-1');
    expect(query.userId).toBe('user_123');
    expect(query.months).toBe(12);
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    entityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', { months: 12 }, 'user_123'),
    ).rejects.toThrow(UnauthorizedException);

    expect(queryBus.execute).not.toHaveBeenCalled();
  });

  it('should pass months parameter via query', async () => {
    entityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    queryBus.execute.mockResolvedValue([]);

    await controller.handle('entity-1', { months: 24 }, 'user_123');

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(GetTreasuryChartQuery),
    );
    const query = queryBus.execute.mock.calls[0][0];
    expect(query.months).toBe(24);
  });

  it('should use default months value of 12 from DTO', async () => {
    entityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    queryBus.execute.mockResolvedValue([]);

    const dto = new GetTreasuryChartDto();
    await controller.handle('entity-1', dto, 'user_123');

    expect(dto.months).toBe(12);
    expect(queryBus.execute).toHaveBeenCalledTimes(1);
  });
});
