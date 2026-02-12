import {
  Controller,
  Put,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CurrentUser } from '@infrastructure/auth/user.decorator';
import { UpdateATenantDto } from '../dto/update-a-tenant.dto.js';
import { UpdateATenantCommand } from '@tenancy/tenant/commands/update-a-tenant.command';
import { TenantFinder } from '../finders/tenant.finder.js';

@Controller('tenants')
export class UpdateATenantController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly tenantFinder: TenantFinder,
  ) {}

  @Put(':id')
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateATenantDto,
    @CurrentUser() userId: string,
  ): Promise<void> {
    const tenant = await this.tenantFinder.findByIdAndUser(id, userId);
    if (!tenant) {
      throw new UnauthorizedException();
    }

    await this.commandBus.execute(
      new UpdateATenantCommand(
        id,
        userId,
        dto.firstName,
        dto.lastName,
        dto.companyName,
        dto.siret,
        dto.email,
        dto.phoneNumber,
        dto.address
          ? {
              street: dto.address.street ?? null,
              postalCode: dto.address.postalCode ?? null,
              city: dto.address.city ?? null,
              complement: dto.address.complement ?? null,
            }
          : undefined,
      ),
    );
  }
}
