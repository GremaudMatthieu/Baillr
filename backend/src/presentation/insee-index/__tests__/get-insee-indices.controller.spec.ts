import { BadRequestException } from '@nestjs/common';
import { GetInseeIndicesController } from '../controllers/get-insee-indices.controller';
import { GetInseeIndicesQuery } from '../queries/get-insee-indices.query';

describe('GetInseeIndicesController', () => {
  let controller: GetInseeIndicesController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, unknown[]> };

  beforeEach(() => {
    queryBus = { execute: jest.fn<Promise<unknown>, unknown[]>() };
    controller = new GetInseeIndicesController(queryBus as never);
  });

  it('should dispatch GetInseeIndicesQuery and return wrapped data', async () => {
    const indices = [{ id: '1', type: 'IRL', quarter: 'Q1', year: 2026, value: 142.06 }];
    queryBus.execute.mockResolvedValue(indices);

    const result = await controller.handle('entity-1', undefined, 'user-1');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetInseeIndicesQuery;
    expect(query).toBeInstanceOf(GetInseeIndicesQuery);
    expect(query.entityId).toBe('entity-1');
    expect(query.userId).toBe('user-1');
    expect(query.type).toBeUndefined();
    expect(result).toEqual({ data: indices });
  });

  it('should pass type filter when provided', async () => {
    queryBus.execute.mockResolvedValue([]);

    await controller.handle('entity-1', 'IRL', 'user-1');

    const query = queryBus.execute.mock.calls[0]?.[0] as GetInseeIndicesQuery;
    expect(query.type).toBe('IRL');
  });

  it('should throw BadRequestException for invalid type query', async () => {
    await expect(controller.handle('entity-1', 'INVALID', 'user-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(queryBus.execute).not.toHaveBeenCalled();
  });
});
