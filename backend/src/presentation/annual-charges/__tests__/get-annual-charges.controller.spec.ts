import { UnauthorizedException } from '@nestjs/common';
import { GetAnnualChargesController } from '../controllers/get-annual-charges.controller';

describe('GetAnnualChargesController', () => {
  let controller: GetAnnualChargesController;
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
    controller = new GetAnnualChargesController(
      mockEntityFinder as never,
      mockAnnualChargesFinder as never,
    );
  });

  it('should return charges for specific fiscal year', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    const charges = { id: 'e1-2025', fiscalYear: 2025, totalAmountCents: 120000 };
    mockAnnualChargesFinder.findByEntityAndYear.mockResolvedValue(charges);

    const result = await controller.handle('entity-1', '2025', 'user-1');

    expect(result).toEqual({ data: charges });
    expect(mockAnnualChargesFinder.findByEntityAndYear).toHaveBeenCalledWith(
      'entity-1',
      2025,
    );
  });

  it('should return all years when no fiscalYear param', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    const allCharges = [
      { id: 'e1-2025', fiscalYear: 2025 },
      { id: 'e1-2024', fiscalYear: 2024 },
    ];
    mockAnnualChargesFinder.findAllByEntity.mockResolvedValue(allCharges);

    const result = await controller.handle('entity-1', undefined, 'user-1');

    expect(result).toEqual({ data: allCharges });
    expect(mockAnnualChargesFinder.findAllByEntity).toHaveBeenCalledWith(
      'entity-1',
    );
  });

  it('should return null for invalid fiscalYear param', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });

    const result = await controller.handle('entity-1', 'abc', 'user-1');

    expect(result).toEqual({ data: null });
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      controller.handle('entity-1', '2025', 'user-1'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
