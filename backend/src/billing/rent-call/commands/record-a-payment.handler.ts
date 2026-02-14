import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { RentCallAggregate } from '../rent-call.aggregate.js';
import { RecordAPaymentCommand } from './record-a-payment.command.js';

@CommandHandler(RecordAPaymentCommand)
export class RecordAPaymentHandler
  implements ICommandHandler<RecordAPaymentCommand>
{
  constructor(
    @InjectAggregateRepository(RentCallAggregate)
    private readonly repository: AggregateRepository<RentCallAggregate>,
  ) {}

  async execute(command: RecordAPaymentCommand): Promise<void> {
    const aggregate = await this.repository.load(command.rentCallId);
    aggregate.recordPayment(
      command.transactionId,
      command.bankStatementId,
      command.amountCents,
      command.payerName,
      command.paymentDate,
      new Date(),
      command.userId,
      command.paymentMethod,
      command.paymentReference,
    );
    await this.repository.save(aggregate);
  }
}
