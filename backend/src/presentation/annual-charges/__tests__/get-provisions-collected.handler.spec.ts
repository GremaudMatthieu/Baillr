import { UnauthorizedException } from '@nestjs/common';
import { GetProvisionsCollectedHandler } from '../queries/get-provisions-collected.handler';
import { GetProvisionsCollectedQuery } from '../queries/get-provisions-collected.query';

describe('GetProvisionsCollectedHandler', () => {
  let handler: GetProvisionsCollectedHandler;
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockAnnualChargesFinder: { findPaidBillingLinesByEntityAndYear: jest.Mock };

  beforeEach(() => {
    mockEntityFinder = { findByIdAndUserId: jest.fn() };
    mockAnnualChargesFinder = { findPaidBillingLinesByEntityAndYear: jest.fn() };
    handler = new GetProvisionsCollectedHandler(
      mockEntityFinder as never,
      mockAnnualChargesFinder as never,
    );
  });

  it('should aggregate billing lines by chargeCategoryId', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockAnnualChargesFinder.findPaidBillingLinesByEntityAndYear.mockResolvedValue([
      {
        billingLines: [
          { chargeCategoryId: 'cat-water', categoryLabel: 'Eau', amountCents: 3000 },
          { chargeCategoryId: 'cat-water', categoryLabel: 'Eau', amountCents: 1500 },
          { chargeCategoryId: 'cat-parking', categoryLabel: 'Parking', amountCents: 5000 },
        ],
      },
      {
        billingLines: [
          { chargeCategoryId: 'cat-water', categoryLabel: 'Eau', amountCents: 3000 },
          { chargeCategoryId: 'cat-teom', categoryLabel: 'TEOM', amountCents: 2000 },
        ],
      },
    ]);

    const result = await handler.execute(
      new GetProvisionsCollectedQuery('entity-1', 2025, 'user-1'),
    );

    expect(result.totalProvisionsCents).toBe(14500);
    expect(result.details).toEqual(
      expect.arrayContaining([
        { chargeCategoryId: 'cat-water', categoryLabel: 'Eau', totalCents: 7500 },
        { chargeCategoryId: 'cat-parking', categoryLabel: 'Parking', totalCents: 5000 },
        { chargeCategoryId: 'cat-teom', categoryLabel: 'TEOM', totalCents: 2000 },
      ]),
    );
    expect(result.details).toHaveLength(3);
  });

  it('should handle legacy provision format', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockAnnualChargesFinder.findPaidBillingLinesByEntityAndYear.mockResolvedValue([
      {
        billingLines: [
          { label: 'Legacy provision', amountCents: 2000, type: 'provision', category: null },
        ],
      },
      {
        billingLines: [
          { label: 'Legacy provision', amountCents: 3000, type: 'provision', category: null },
        ],
      },
    ]);

    const result = await handler.execute(
      new GetProvisionsCollectedQuery('entity-1', 2025, 'user-1'),
    );

    expect(result.totalProvisionsCents).toBe(5000);
    expect(result.details).toEqual([
      { chargeCategoryId: null, categoryLabel: 'Legacy provision', totalCents: 5000 },
    ]);
  });

  it('should delegate query to finder with correct params', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockAnnualChargesFinder.findPaidBillingLinesByEntityAndYear.mockResolvedValue([]);

    await handler.execute(new GetProvisionsCollectedQuery('entity-1', 2025, 'user-1'));

    expect(mockAnnualChargesFinder.findPaidBillingLinesByEntityAndYear).toHaveBeenCalledWith(
      'entity-1',
      2025,
    );
  });

  it('should return zero totals when no paid rent calls', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockAnnualChargesFinder.findPaidBillingLinesByEntityAndYear.mockResolvedValue([]);

    const result = await handler.execute(
      new GetProvisionsCollectedQuery('entity-1', 2025, 'user-1'),
    );

    expect(result.totalProvisionsCents).toBe(0);
    expect(result.details).toEqual([]);
  });

  it('should skip legacy option-type billing lines', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue({ id: 'entity-1' });
    mockAnnualChargesFinder.findPaidBillingLinesByEntityAndYear.mockResolvedValue([
      {
        billingLines: [{ label: 'Parking', amountCents: 5000, type: 'option', category: null }],
      },
    ]);

    const result = await handler.execute(
      new GetProvisionsCollectedQuery('entity-1', 2025, 'user-1'),
    );

    expect(result.totalProvisionsCents).toBe(0);
    expect(result.details).toEqual([]);
  });

  it('should throw UnauthorizedException if entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      handler.execute(new GetProvisionsCollectedQuery('entity-1', 2025, 'user-1')),
    ).rejects.toThrow(UnauthorizedException);
  });
});
