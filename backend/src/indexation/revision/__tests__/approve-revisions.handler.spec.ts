import { mockCqrx } from './mock-cqrx';

jest.mock('nestjs-cqrx', () => mockCqrx);

import { ApproveRevisionsHandler } from '../commands/approve-revisions.handler';
import { ApproveRevisionsCommand } from '../commands/approve-revisions.command';
import { RevisionAggregate } from '../revision.aggregate';
import { IndexCalculatorService } from '../services/index-calculator.service';

function createCalculatedRevisionAggregate(
  id: string,
  leaseId: string,
  entityId: string,
): RevisionAggregate {
  const aggregate = new RevisionAggregate(id);
  const calculator = new IndexCalculatorService();
  aggregate.calculateRevision(
    leaseId,
    entityId,
    'user-1',
    'tenant-1',
    'unit-1',
    'Dupont Jean',
    'Apt A',
    75000,
    138.19,
    'Q2',
    142.06,
    'Q2',
    2025,
    'IRL',
    calculator,
  );
  aggregate.commit();
  return aggregate;
}

describe('ApproveRevisionsHandler', () => {
  let handler: ApproveRevisionsHandler;
  let mockRevisionLoad: jest.Mock;
  let mockRevisionSave: jest.Mock;

  beforeEach(() => {
    mockRevisionLoad = jest.fn();
    mockRevisionSave = jest.fn().mockResolvedValue(undefined);

    handler = new ApproveRevisionsHandler(
      { load: mockRevisionLoad, save: mockRevisionSave } as never,
    );
  });

  it('should approve a single revision', async () => {
    const revision = createCalculatedRevisionAggregate('rev-1', 'lease-1', 'entity-1');

    mockRevisionLoad.mockResolvedValue(revision);

    const command = new ApproveRevisionsCommand(['rev-1'], 'entity-1', 'user-1');
    await handler.execute(command);

    expect(mockRevisionLoad).toHaveBeenCalledWith('rev-1');
    expect(mockRevisionSave).toHaveBeenCalledTimes(1);

    // Verify revision was approved
    const savedRevision = mockRevisionSave.mock.calls[0][0] as RevisionAggregate;
    const revisionEvents = savedRevision.getUncommittedEvents();
    expect(revisionEvents).toHaveLength(1);
    expect(revisionEvents[0].constructor.name).toBe('RevisionApproved');
  });

  it('should approve multiple revisions in batch', async () => {
    const revision1 = createCalculatedRevisionAggregate('rev-1', 'lease-1', 'entity-1');
    const revision2 = createCalculatedRevisionAggregate('rev-2', 'lease-2', 'entity-1');

    mockRevisionLoad
      .mockResolvedValueOnce(revision1)
      .mockResolvedValueOnce(revision2);

    const command = new ApproveRevisionsCommand(
      ['rev-1', 'rev-2'],
      'entity-1',
      'user-1',
    );
    await handler.execute(command);

    expect(mockRevisionLoad).toHaveBeenCalledTimes(2);
    expect(mockRevisionSave).toHaveBeenCalledTimes(2);
  });

  it('should not interact with lease aggregate (decoupled via reaction)', async () => {
    const revision = createCalculatedRevisionAggregate('rev-1', 'lease-1', 'entity-1');

    mockRevisionLoad.mockResolvedValue(revision);

    const command = new ApproveRevisionsCommand(['rev-1'], 'entity-1', 'user-1');
    await handler.execute(command);

    // Handler only saves revision, lease is handled by RevisionApprovedReaction
    expect(mockRevisionSave).toHaveBeenCalledTimes(1);
  });
});
