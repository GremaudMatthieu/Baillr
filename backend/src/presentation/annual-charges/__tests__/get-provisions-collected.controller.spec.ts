import { BadRequestException } from '@nestjs/common';
import { GetProvisionsCollectedController } from '../controllers/get-provisions-collected.controller';
import { GetProvisionsCollectedQuery } from '../queries/get-provisions-collected.query';

describe('GetProvisionsCollectedController', () => {
  let controller: GetProvisionsCollectedController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, unknown[]> };

  beforeEach(() => {
    queryBus = { execute: jest.fn<Promise<unknown>, unknown[]>() };
    controller = new GetProvisionsCollectedController(queryBus as never);
  });

  it('should dispatch GetProvisionsCollectedQuery and return wrapped data', async () => {
    const provisionsData = {
      totalProvisionsCents: 14500,
      details: [{ chargeCategoryId: 'cat-water', categoryLabel: 'Eau', totalCents: 7500 }],
    };
    queryBus.execute.mockResolvedValue(provisionsData);

    const result = await controller.handle('entity-1', '2025', 'user-1');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetProvisionsCollectedQuery;
    expect(query).toBeInstanceOf(GetProvisionsCollectedQuery);
    expect(query.entityId).toBe('entity-1');
    expect(query.fiscalYear).toBe(2025);
    expect(query.userId).toBe('user-1');
    expect(result).toEqual({ data: provisionsData });
  });

  it('should throw BadRequestException when fiscalYear missing', async () => {
    await expect(controller.handle('entity-1', undefined, 'user-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(queryBus.execute).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when fiscalYear is invalid', async () => {
    await expect(controller.handle('entity-1', 'abc', 'user-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(queryBus.execute).not.toHaveBeenCalled();
  });
});
