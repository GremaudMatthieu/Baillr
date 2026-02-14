import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { KurrentDbService } from '@infrastructure/eventstore/kurrentdb.service';
import { START, streamNameFilter } from '@kurrent/kurrentdb-client';
import { ReviseLeaseRentCommand } from '@tenancy/lease/commands/revise-lease-rent.command';
import type { RevisionApprovedData } from '@indexation/revision/events/revision-approved.event';

@Injectable()
export class RevisionApprovedReaction implements OnModuleInit {
  private readonly logger = new Logger(RevisionApprovedReaction.name);
  private reconnectAttempts = 0;
  private processingChain: Promise<void> = Promise.resolve();

  constructor(
    private readonly kurrentDb: KurrentDbService,
    private readonly commandBus: CommandBus,
  ) {}

  onModuleInit() {
    this.logger.log('Starting revision-approved reaction subscription');
    this.subscribeToAll();
  }

  private subscribeToAll(): void {
    const subscription = this.kurrentDb.client.subscribeToAll({
      fromPosition: START,
      filter: streamNameFilter({ prefixes: ['revision_'] }),
    });

    subscription.on('data', ({ event }) => {
      if (!event || event.type !== 'RevisionApproved') return;
      this.reconnectAttempts = 0;
      this.processingChain = this.processingChain.then(() =>
        this.handleRevisionApproved(event.data as unknown as RevisionApprovedData),
      );
    });

    subscription.on('error', (error: Error) => {
      this.reconnectAttempts++;
      const delay = Math.min(
        1000 * Math.pow(2, this.reconnectAttempts),
        30_000,
      );
      this.logger.error(
        `Revision-approved reaction subscription error: ${error.message}`,
      );
      this.logger.log(
        `Reconnecting revision-approved reaction in ${delay}ms (attempt ${this.reconnectAttempts})...`,
      );
      setTimeout(() => this.subscribeToAll(), delay);
    });
  }

  private async handleRevisionApproved(data: RevisionApprovedData): Promise<void> {
    try {
      await this.commandBus.execute(
        new ReviseLeaseRentCommand(
          data.leaseId,
          data.newRentCents,
          data.newIndexValue,
          data.newIndexQuarter,
          data.newIndexYear,
          data.revisionId,
        ),
      );
      this.logger.log(
        `Dispatched ReviseLeaseRentCommand for lease ${data.leaseId} (revision ${data.revisionId})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to dispatch ReviseLeaseRentCommand for lease ${data.leaseId}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }
}
