import { GetAnnualChargesController } from '../controllers/get-annual-charges.controller';
import { GetAnnualChargesQuery } from '../queries/get-annual-charges.query';

describe('GetAnnualChargesController', () => {
  let controller: GetAnnualChargesController;
  let queryBus: { execute: jest.Mock<Promise<unknown>, unknown[]> };

  beforeEach(() => {
    queryBus = { execute: jest.fn<Promise<unknown>, unknown[]>() };
    controller = new GetAnnualChargesController(queryBus as never);
  });

  it('should dispatch GetAnnualChargesQuery with fiscal year and return wrapped data', async () => {
    const charges = { id: 'e1-2025', fiscalYear: 2025, totalAmountCents: 120000 };
    queryBus.execute.mockResolvedValue(charges);

    const result = await controller.handle('entity-1', '2025', 'user-1');

    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    const query = queryBus.execute.mock.calls[0]?.[0] as GetAnnualChargesQuery;
    expect(query).toBeInstanceOf(GetAnnualChargesQuery);
    expect(query.entityId).toBe('entity-1');
    expect(query.userId).toBe('user-1');
    expect(query.fiscalYear).toBe(2025);
    expect(result).toEqual({ data: charges });
  });

  it('should dispatch query without fiscal year when not provided', async () => {
    const allCharges = [
      { id: 'e1-2025', fiscalYear: 2025 },
      { id: 'e1-2024', fiscalYear: 2024 },
    ];
    queryBus.execute.mockResolvedValue(allCharges);

    const result = await controller.handle('entity-1', undefined, 'user-1');

    const query = queryBus.execute.mock.calls[0]?.[0] as GetAnnualChargesQuery;
    expect(query.fiscalYear).toBeUndefined();
    expect(result).toEqual({ data: allCharges });
  });

  it('should return null for invalid fiscalYear param without dispatching query', async () => {
    const result = await controller.handle('entity-1', 'abc', 'user-1');

    expect(result).toEqual({ data: null });
    expect(queryBus.execute).not.toHaveBeenCalled();
  });
});
