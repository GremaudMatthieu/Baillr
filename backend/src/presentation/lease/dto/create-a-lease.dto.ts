import { IsUUID, IsString, IsIn, IsInt, Min, Max, IsDateString } from 'class-validator';

export class CreateALeaseDto {
  @IsUUID()
  id!: string;

  @IsUUID()
  tenantId!: string;

  @IsUUID()
  unitId!: string;

  @IsDateString()
  startDate!: string;

  @IsInt()
  @Min(1)
  @Max(99999999)
  rentAmountCents!: number;

  @IsInt()
  @Min(0)
  @Max(99999999)
  securityDepositCents!: number;

  @IsInt()
  @Min(1)
  @Max(31)
  monthlyDueDate!: number;

  @IsString()
  @IsIn(['IRL', 'ILC', 'ICC'])
  revisionIndexType!: string;
}
