import { UnauthorizedException } from '@nestjs/common';
import { ApproveRevisionsController } from '../controllers/approve-revisions.controller';
import { ApproveRevisionsCommand } from '@indexation/revision/commands/approve-revisions.command';

describe('ApproveRevisionsController', () => {
  let controller: ApproveRevisionsController;
  let mockCommandBus: { execute: jest.Mock };
  let mockEntityFinder: { findByIdAndUserId: jest.Mock };

  beforeEach(() => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockEntityFinder = {
      findByIdAndUserId: jest.fn().mockResolvedValue({ id: 'entity-1' }),
    };
    controller = new ApproveRevisionsController(
      mockCommandBus as never,
      mockEntityFinder as never,
    );
  });

  it('should throw UnauthorizedException when entity not found', async () => {
    mockEntityFinder.findByIdAndUserId.mockResolvedValue(null);
    await expect(
      controller.handle('entity-1', { revisionIds: ['rev-1'] }, 'user-1'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should execute ApproveRevisionsCommand', async () => {
    await controller.handle(
      'entity-1',
      { revisionIds: ['rev-1', 'rev-2'] },
      'user-1',
    );

    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      new ApproveRevisionsCommand(['rev-1', 'rev-2'], 'entity-1', 'user-1'),
    );
  });

  it('should verify entity ownership before executing command', async () => {
    await controller.handle('entity-1', { revisionIds: ['rev-1'] }, 'user-1');

    expect(mockEntityFinder.findByIdAndUserId).toHaveBeenCalledWith(
      'entity-1',
      'user-1',
    );
  });
});
