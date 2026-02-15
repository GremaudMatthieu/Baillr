import { UnauthorizedException } from '@nestjs/common';
import {
  CalculateRevisionsController,
  type BatchCalculationResult,
} from '../controllers/calculate-revisions.controller';
import { CalculateARevisionCommand } from '@indexation/revision/commands/calculate-a-revision.command';

describe('CalculateRevisionsController', () => {
  let controller: CalculateRevisionsController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };
  let mockLeaseFinder: { findAllActiveWithRevisionParams: jest.Mock };
  let mockInseeIndexFinder: {
    findByTypeQuarterYear: jest.Mock;
  };
  let mockRevisionFinder: { existsByLeaseAndPeriod: jest.Mock };

  const baseLease = {
    id: 'lease-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    rentAmountCents: 75000,
    revisionIndexType: 'IRL',
    referenceQuarter: 'Q2',
    referenceYear: 2025,
    baseIndexValue: 138.19,
    tenant: {
      firstName: 'Jean',
      lastName: 'Dupont',
      companyName: null,
      type: 'individual',
    },
    unit: { identifier: 'Apt A' },
  };

  const baseIndex = {
    type: 'IRL',
    quarter: 'Q2',
    year: 2025,
    value: 142.06,
  };

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockEntityFinder = {
      findByIdAndUserId: jest.fn().mockResolvedValue({ id: 'entity-1' }),
    };
    mockLeaseFinder = {
      findAllActiveWithRevisionParams: jest.fn().mockResolvedValue([baseLease]),
    };
    mockInseeIndexFinder = {
      findByTypeQuarterYear: jest.fn().mockResolvedValue(baseIndex),
    };
    mockRevisionFinder = {
      existsByLeaseAndPeriod: jest.fn().mockResolvedValue(false),
    };

    controller = new CalculateRevisionsController(
      mockCommandBus as never,
      mockEntityFinder as never,
      mockLeaseFinder as never,
      mockInseeIndexFinder as never,
      mockRevisionFinder as never,
    );
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);
    await expect(controller.handle('entity-1', 'user-1')).rejects.toThrow(UnauthorizedException);
  });

  it('should calculate revisions for eligible leases', async () => {
    const result: BatchCalculationResult = await controller.handle('entity-1', 'user-1');
    expect(result.calculated).toBe(1);
    expect(result.skipped).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
    expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
    expect(mockCommandBus.execute).toHaveBeenCalledWith(expect.any(CalculateARevisionCommand));
    // Verify baseIndexYear is passed to the command
    const command = mockCommandBus.execute.mock.calls[0][0] as CalculateARevisionCommand;
    expect(command.baseIndexYear).toBe(2025);
    // Verify entityId is passed to index lookup
    expect(mockInseeIndexFinder.findByTypeQuarterYear).toHaveBeenCalledWith(
      'IRL',
      'Q2',
      2025,
      'entity-1',
    );
  });

  it('should skip leases already revised for the period', async () => {
    mockRevisionFinder.existsByLeaseAndPeriod.mockResolvedValue(true);
    const result = await controller.handle('entity-1', 'user-1');
    expect(result.calculated).toBe(0);
    expect(result.skipped).toContain('lease-1');
    expect(mockCommandBus.execute).not.toHaveBeenCalled();
  });

  it('should skip leases with missing index', async () => {
    mockInseeIndexFinder.findByTypeQuarterYear.mockResolvedValue(null);
    const result = await controller.handle('entity-1', 'user-1');
    expect(result.calculated).toBe(0);
    expect(result.skipped).toContain('lease-1');
  });

  it('should use company name for company tenants', async () => {
    const companyLease = {
      ...baseLease,
      tenant: {
        firstName: 'Jean',
        lastName: 'Dupont',
        companyName: 'SARL Dupont',
        type: 'company',
      },
    };
    mockLeaseFinder.findAllActiveWithRevisionParams.mockResolvedValue([companyLease]);

    await controller.handle('entity-1', 'user-1');

    const command = mockCommandBus.execute.mock.calls[0][0] as CalculateARevisionCommand;
    expect(command.tenantName).toBe('SARL Dupont');
  });

  it('should handle errors gracefully per lease', async () => {
    mockCommandBus.execute.mockRejectedValue(new Error('Command failed'));
    const result = await controller.handle('entity-1', 'user-1');
    expect(result.calculated).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('lease-1');
  });

  it('should return empty result when no leases found', async () => {
    mockLeaseFinder.findAllActiveWithRevisionParams.mockResolvedValue([]);
    const result = await controller.handle('entity-1', 'user-1');
    expect(result.calculated).toBe(0);
    expect(result.skipped).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});
