import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectAggregateRepository, AggregateRepository } from 'nestjs-cqrx';
import { TenantAggregate } from '../tenant.aggregate.js';
import { RegisterATenantCommand } from './register-a-tenant.command.js';

@CommandHandler(RegisterATenantCommand)
export class RegisterATenantHandler implements ICommandHandler<RegisterATenantCommand> {
  constructor(
    @InjectAggregateRepository(TenantAggregate)
    private readonly repository: AggregateRepository<TenantAggregate>,
  ) {}

  async execute(command: RegisterATenantCommand): Promise<void> {
    const tenant = new TenantAggregate(command.id);
    tenant.create(
      command.userId,
      command.entityId,
      command.type,
      command.firstName,
      command.lastName,
      command.companyName,
      command.siret,
      command.email,
      command.phoneNumber,
      command.address,
    );
    await this.repository.save(tenant);
  }
}
