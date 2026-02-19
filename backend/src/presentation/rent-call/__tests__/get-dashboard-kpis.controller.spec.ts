import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetDashboardKpisController } from '../controllers/get-dashboard-kpis.controller';
import { EntityFinder } from '../../entity/finders/entity.finder';
import { GetDashboardKpisQuery } from '../queries/get-dashboard-kpis.query';

describe('GetDashboardKpisController', () => {
  let controller: GetDashboardKpisController;
  let entityFinder: { findByIdAndUserId: jest.Mock };
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    entityFinder = { findByIdAndUserId: jest.fn() };
    queryBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetDashboardKpisController],
      providers: [
        { provide: EntityFinder, useValue: entityFinder },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    controller = module.get<GetDashboardKpisController>(GetDashboardKpisController);
  });

  it('should return KPIs when entity exists', async () => {
    entityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    const mockKpis = {
      currentMonth: {
        collectionRatePercent: 85.5,
        totalCalledCents: 200000,
        totalReceivedCents: 171000,
        unpaidCount: 1,
        outstandingDebtCents: 29000,
      },
      previousMonth: {
        collectionRatePercent: 100,
        totalCalledCents: 180000,
        totalReceivedCents: 180000,
        unpaidCount: 0,
        outstandingDebtCents: 0,
      },
    };
    queryBus.execute.mockResolvedValue(mockKpis);

    const result = await controller.handle(
      'entity-1',
      { month: '2026-02' } as any,
      'user_123',
    );

    expect(result).toEqual(mockKpis);
    expect(entityFinder.findByIdAndUserId).toHaveBeenCalledWith('entity-1', 'user_123');
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(GetDashboardKpisQuery),
    );
    const query = queryBus.execute.mock.calls[0][0];
    expect(query.entityId).toBe('entity-1');
    expect(query.userId).toBe('user_123');
    expect(query.month).toBe('2026-02');
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    entityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', { month: '2026-02' } as any, 'user_123'),
    ).rejects.toThrow(UnauthorizedException);

    expect(queryBus.execute).not.toHaveBeenCalled();
  });
});
