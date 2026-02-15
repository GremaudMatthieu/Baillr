import { UnauthorizedException } from '@nestjs/common';
import { GetAnnualChargesHandler } from '../queries/get-annual-charges.handler';
import { GetAnnualChargesQuery } from '../queries/get-annual-charges.query';

describe('GetAnnualChargesHandler', () => {
  let handler: GetAnnualChargesHandler;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockAnnualChargesFinder: {
    findByEntityAndYear: jest.Mock;
    findAllByEntity: jest.Mock;
  };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockAnnualChargesFinder = {
      findByEntityAndYear: jest.fn(),
      findAllByEntity: jest.fn(),
    };
    handler = new GetAnnualChargesHandler(
      mockEntityFinder as never,
      mockAnnualChargesFinder as never,
    );
  });

  it('should return charges for a specific fiscal year', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    const charges = { id: 'ac-1', fiscalYear: 2025, totalAmountCents: 120000 };
    mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(charges);

    const result = await handler.execute(new GetAnnualChargesQuery('entity-1', 'user-1', 2025));

    expect(result).toEqual(charges);
    expect(mockAnnualChargesFinder.findByEntityAndYear).toHaveBeenCalledWith('entity-1', 2025);
  });

  it('should return all charges when no fiscal year specified', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    const allCharges = [
      { id: 'ac-1', fiscalYear: 2025 },
      { id: 'ac-2', fiscalYear: 2024 },
    ];
    mockAnnualChargesFinder.findAllByEntity.mockResolvedValue(allCharges);

    const result = await handler.execute(new GetAnnualChargesQuery('entity-1', 'user-1'));

    expect(result).toEqual(allCharges);
    expect(mockAnnualChargesFinder.findAllByEntity).toHaveBeenCalledWith('entity-1');
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      handler.execute(new GetAnnualChargesQuery('entity-1', 'user-1', 2025)),
    ).rejects.toThrow(UnauthorizedException);
  });
});
