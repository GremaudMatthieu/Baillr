import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { RevisionAggregate } from '@indexation/revision/revision.aggregate';
import { ApproveRevisionsCommand } from '@indexation/revision/commands/approve-revisions.command';

@CommandHandler(ApproveRevisionsCommand)
export class ApproveRevisionsHandler implements ICommandHandler<ApproveRevisionsCommand> {
  constructor(
    @InjectAggregateRepository(RevisionAggregate)
    private readonly revisionRepository: AggregateRepository<RevisionAggregate>,
  ) {}

  async execute(command: ApproveRevisionsCommand): Promise<void> {
    for (const revisionId of command.revisionIds) {
      const revision = await this.revisionRepository.load(revisionId);
      revision.approve(command.userId);
      await this.revisionRepository.save(revision);
    }
  }
}
