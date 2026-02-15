import { UnauthorizedException } from '@nestjs/common';
import { GetChargeRegularizationHandler } from '../queries/get-charge-regularization.handler';
import { GetChargeRegularizationQuery } from '../queries/get-charge-regularization.query';

describe('GetChargeRegularizationHandler', () => {
  let handler: GetChargeRegularizationHandler;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockChargeRegularizationFinder: {
    findByEntityAndYear: jest.Mock;
    findAllByEntity: jest.Mock;
  };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockChargeRegularizationFinder = {
      findByEntityAndYear: jest.fn(),
      findAllByEntity: jest.fn(),
    };
    handler = new GetChargeRegularizationHandler(
      mockEntityFinder as never,
      mockChargeRegularizationFinder as never,
    );
  });

  it('should return regularization for a specific fiscal year', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    const regularization = {
      id: 'cr-1',
      fiscalYear: 2025,
      totalBalanceCents: 5000,
    };
    mockChargeRegularizationFinder.findByEntityAndYear.mockResolvedValue(
      regularization,
    );

    const result = await handler.execute(
      new GetChargeRegularizationQuery('entity-1', 'user-1', 2025),
    );

    expect(result).toEqual(regularization);
    expect(
      mockChargeRegularizationFinder.findByEntityAndYear,
    ).toHaveBeenCalledWith('entity-1', 2025);
  });

  it('should return all regularizations when no fiscal year specified', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    const allRegularizations = [
      { id: 'cr-1', fiscalYear: 2025 },
      { id: 'cr-2', fiscalYear: 2024 },
    ];
    mockChargeRegularizationFinder.findAllByEntity.mockResolvedValue(
      allRegularizations,
    );

    const result = await handler.execute(
      new GetChargeRegularizationQuery('entity-1', 'user-1'),
    );

    expect(result).toEqual(allRegularizations);
    expect(
      mockChargeRegularizationFinder.findAllByEntity,
    ).toHaveBeenCalledWith('entity-1');
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      handler.execute(
        new GetChargeRegularizationQuery('entity-1', 'user-1', 2025),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });
});
