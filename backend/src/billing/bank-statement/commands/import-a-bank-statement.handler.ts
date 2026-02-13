import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository } from 'nestjs-cqrx';
import { AggregateRepository } from 'nestjs-cqrx';
import { ImportABankStatementCommand } from './import-a-bank-statement.command.js';
import { BankStatementAggregate } from '../bank-statement.aggregate.js';

@CommandHandler(ImportABankStatementCommand)
export class ImportABankStatementHandler
  implements ICommandHandler<ImportABankStatementCommand>
{
  constructor(
    @InjectAggregateRepository(BankStatementAggregate)
    private readonly repository: AggregateRepository<BankStatementAggregate>,
  ) {}

  async execute(command: ImportABankStatementCommand): Promise<void> {
    const aggregate = new BankStatementAggregate(command.id);

    aggregate.import(
      command.entityId,
      command.userId,
      command.bankAccountId,
      command.fileName,
      command.transactions.map((t) => ({
        date: t.date,
        amountCents: t.amountCents,
        payerName: t.payerName,
        reference: t.reference,
        ...(t.isDuplicate ? { isDuplicate: true } : {}),
      })),
      new Date(),
    );

    await this.repository.save(aggregate);
  }
}
