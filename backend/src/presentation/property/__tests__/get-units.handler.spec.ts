import { GetUnitsHandler } from '../queries/get-units.handler';
import { GetUnitsQuery } from '../queries/get-units.query';

describe('GetUnitsHandler', () => {
  let handler: GetUnitsHandler;
  let finder: { findAllByPropertyAndUser: jest.Mock };

  const mockUnits = [
    { id: 'unit-1', identifier: 'Apt 3B', type: 'apartment' },
    { id: 'unit-2', identifier: 'Parking B1', type: 'parking' },
  ];

  beforeEach(() => {
    finder = { findAllByPropertyAndUser: jest.fn().mockResolvedValue(mockUnits) };
    handler = new GetUnitsHandler(finder as never);
  });

  it('should return units from finder', async () => {
    const query = new GetUnitsQuery('property-1', 'user_clerk_123');

    const result = await handler.execute(query);

    expect(finder.findAllByPropertyAndUser).toHaveBeenCalledWith('property-1', 'user_clerk_123');
    expect(result).toEqual(mockUnits);
  });

  it('should return empty array when no units exist', async () => {
    finder.findAllByPropertyAndUser.mockResolvedValue([]);
    const query = new GetUnitsQuery('property-1', 'user_clerk_123');

    const result = await handler.execute(query);

    expect(result).toEqual([]);
  });
});
