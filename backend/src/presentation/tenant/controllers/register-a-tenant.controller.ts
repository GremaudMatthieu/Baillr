import {
  Controller,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { RegisterATenantDto } from '../dto/register-a-tenant.dto.js';
import { RegisterATenantCommand } from '@tenancy/tenant/commands/register-a-tenant.command';
import { EntityFinder } from '../../entity/finders/entity.finder.js';

@Controller('entities/:entityId/tenants')
export class RegisterATenantController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly entityFinder: EntityFinder,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @Body() dto: RegisterATenantDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const entity = await this.entityFinder.findByIdAndUserId(entityId, userId);
    if (!entity) {
      throw new UnauthorizedException();
    }

    await this.commandBus.execute(
      new RegisterATenantCommand(
        dto.id,
        userId,
        entityId,
        dto.type,
        dto.firstName,
        dto.lastName,
        dto.companyName ?? null,
        dto.siret ?? null,
        dto.email,
        dto.phoneNumber ?? null,
        {
          street: dto.address?.street ?? null,
          postalCode: dto.address?.postalCode ?? null,
          city: dto.address?.city ?? null,
          complement: dto.address?.complement ?? null,
        },
        dto.insuranceProvider ?? null,
        dto.policyNumber ?? null,
        dto.renewalDate ?? null,
      ),
    );
  }
}
