import { randomUUID } from 'crypto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { RentCallAggregate } from '../rent-call.aggregate.js';
import {
  GenerateRentCallsForMonthCommand,
  BatchHandlerResult,
} from './generate-rent-calls-for-month.command.js';
import { RentCallMonth } from '../rent-call-month.js';
import { RentCallCalculationService } from '../rent-call-calculation.service.js';

@CommandHandler(GenerateRentCallsForMonthCommand)
export class GenerateRentCallsForMonthHandler implements ICommandHandler<
  GenerateRentCallsForMonthCommand,
  BatchHandlerResult
> {
  constructor(
    private readonly calculationService: RentCallCalculationService,
    @InjectAggregateRepository(RentCallAggregate)
    private readonly repository: AggregateRepository<RentCallAggregate>,
  ) {}

  async execute(command: GenerateRentCallsForMonthCommand): Promise<BatchHandlerResult> {
    const { entityId, userId, month, activeLeases } = command;

    if (activeLeases.length === 0) {
      return { generated: 0, totalAmountCents: 0, exceptions: [] };
    }

    const rentCallMonth = RentCallMonth.fromString(month);
    const calculations = this.calculationService.calculateForMonth(activeLeases, rentCallMonth);

    if (calculations.length === 0) {
      return { generated: 0, totalAmountCents: 0, exceptions: [] };
    }

    const results = await Promise.allSettled(
      calculations.map(async (calc) => {
        const rentCall = new RentCallAggregate(randomUUID());
        rentCall.generate(
          entityId,
          userId,
          calc.leaseId,
          calc.tenantId,
          calc.unitId,
          month,
          calc.rentAmountCents,
          calc.billingLines,
          calc.totalAmountCents,
          calc.isProRata,
          calc.occupiedDays,
          calc.totalDaysInMonth,
        );
        await this.repository.save(rentCall);
        return calc;
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
