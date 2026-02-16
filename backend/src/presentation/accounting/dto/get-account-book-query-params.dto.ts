import { IsOptional, IsDateString, IsUUID, IsIn } from 'class-validator';

export class GetAccountBookQueryParamsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIn([
    'rent_call',
    'payment',
    'overpayment_credit',
    'charge_regularization',
    'adjustment',
  ])
  category?: string;

  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
