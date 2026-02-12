import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { TenantAggregate } from '../tenant.aggregate.js';
import { UpdateATenantCommand } from './update-a-tenant.command.js';

@CommandHandler(UpdateATenantCommand)
export class UpdateATenantHandler implements ICommandHandler<UpdateATenantCommand> {
  constructor(
    @InjectAggregateRepository(TenantAggregate)
    private readonly repository: AggregateRepository<TenantAggregate>,
  ) {}

  async execute(command: UpdateATenantCommand): Promise<void> {
    const tenant = await this.repository.load(command.id);
    tenant.update(command.userId, {
      firstName: command.firstName,
      lastName: command.lastName,
      companyName: command.companyName,
      siret: command.siret,
      email: command.email,
      phoneNumber: command.phoneNumber,
      address: command.address,
      insuranceProvider: command.insuranceProvider,
      policyNumber: command.policyNumber,
      renewalDate: command.renewalDate,
    });
    await this.repository.save(tenant);
  }
}
