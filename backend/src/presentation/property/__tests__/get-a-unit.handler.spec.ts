import { NotFoundException } from '@nestjs/common';
import { GetAUnitHandler } from '../queries/get-a-unit.handler';
import { GetAUnitQuery } from '../queries/get-a-unit.query';

describe('GetAUnitHandler', () => {
  let handler: GetAUnitHandler;
  let finder: { findByIdAndUser: jest.Mock };

  const mockUnit = {
    id: 'unit-1',
    propertyId: 'property-1',
    userId: 'user_clerk_123',
    identifier: 'Apt 3B',
    type: 'apartment',
    floor: 3,
    surfaceArea: 65.5,
    billableOptions: [],
  };

  beforeEach(() => {
    finder = { findByIdAndUser: jest.fn().mockResolvedValue(mockUnit) };
    handler = new GetAUnitHandler(finder as never);
  });

  it('should return unit when found', async () => {
    const query = new GetAUnitQuery('unit-1', 'user_clerk_123');

    const result = await handler.execute(query);

    expect(finder.findByIdAndUser).toHaveBeenCalledWith('unit-1', 'user_clerk_123');
    expect(result).toEqual(mockUnit);
  });

  it('should throw NotFoundException when unit not found', async () => {
    finder.findByIdAndUser.mockResolvedValue(null);
    const query = new GetAUnitQuery('missing-id', 'user_clerk_123');

    await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
  });
});
