import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { RentCallAggregate } from '../rent-call.aggregate.js';
import {
  GenerateRentCallsForMonthCommand,
  BatchHandlerResult,
} from './generate-rent-calls-for-month.command.js';

@CommandHandler(GenerateRentCallsForMonthCommand)
export class GenerateRentCallsForMonthHandler implements ICommandHandler<
  GenerateRentCallsForMonthCommand,
  BatchHandlerResult
> {
  constructor(
    @InjectAggregateRepository(RentCallAggregate)
    private readonly repository: AggregateRepository<RentCallAggregate>,
  ) {}

  async execute(command: GenerateRentCallsForMonthCommand): Promise<BatchHandlerResult> {
    if (command.rentCallData.length === 0) {
      return { generated: 0, totalAmountCents: 0, exceptions: [] };
    }

    const results = await Promise.allSettled(
      command.rentCallData.map(async (item) => {
        const rentCall = new RentCallAggregate(item.id);
        rentCall.generate(
          command.entityId,
          command.userId,
          item.leaseId,
          item.tenantId,
          item.unitId,
          command.month,
          item.rentAmountCents,
          item.billingLines,
          item.totalAmountCents,
          item.isProRata,
          item.occupiedDays,
          item.totalDaysInMonth,
        );
        await this.repository.save(rentCall);
        return item;
      }),
    );

    const exceptions: string[] = [];
    let generated = 0;
    let totalAmountCents = 0;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        generated++;
        totalAmountCents += result.value.totalAmountCents;
      } else {
        const reason = result.reason;
        exceptions.push(reason instanceof Error ? reason.message : 'erreur inconnue');
      }
    }

    return { generated, totalAmountCents, exceptions };
  }
}
