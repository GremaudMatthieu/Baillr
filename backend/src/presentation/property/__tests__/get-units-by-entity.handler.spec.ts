import { GetUnitsByEntityHandler } from '../queries/get-units-by-entity.handler';
import { GetUnitsByEntityQuery } from '../queries/get-units-by-entity.query';

describe('GetUnitsByEntityHandler', () => {
  let handler: GetUnitsByEntityHandler;
  let finder: { findAllByEntityAndUser: jest.Mock };

  const mockUnitsWithProperty = [
    {
      id: 'unit-1',
      propertyId: 'prop-1',
      userId: 'user_clerk_123',
      identifier: 'Apt 3B',
      type: 'apartment',
      floor: 2,
      surfaceArea: 45.0,
      billableOptions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      property: { name: 'Résidence Sapiac' },
    },
    {
      id: 'unit-2',
      propertyId: 'prop-1',
      userId: 'user_clerk_123',
      identifier: 'Parking B1',
      type: 'parking',
      floor: null,
      surfaceArea: 12.0,
      billableOptions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      property: { name: 'Résidence Sapiac' },
    },
  ];

  beforeEach(() => {
    finder = { findAllByEntityAndUser: jest.fn().mockResolvedValue(mockUnitsWithProperty) };
    handler = new GetUnitsByEntityHandler(finder as never);
  });

  it('should return units with propertyName mapped from property.name', async () => {
    const query = new GetUnitsByEntityQuery('entity-1', 'user_clerk_123');

    const result = await handler.execute(query);

    expect(finder.findAllByEntityAndUser).toHaveBeenCalledWith('entity-1', 'user_clerk_123');
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty('propertyName', 'Résidence Sapiac');
    expect(result[0]).not.toHaveProperty('property');
    expect(result[1]).toHaveProperty('propertyName', 'Résidence Sapiac');
  });

  it('should return empty array when no units exist', async () => {
    finder.findAllByEntityAndUser.mockResolvedValue([]);
    const query = new GetUnitsByEntityQuery('entity-1', 'user_clerk_123');

    const result = await handler.execute(query);

    expect(result).toEqual([]);
  });

  it('should preserve all unit fields in the response', async () => {
    const query = new GetUnitsByEntityQuery('entity-1', 'user_clerk_123');

    const result = await handler.execute(query);

    expect(result[0]).toMatchObject({
      id: 'unit-1',
      propertyId: 'prop-1',
      identifier: 'Apt 3B',
      type: 'apartment',
      floor: 2,
      surfaceArea: 45.0,
    });
  });
});
