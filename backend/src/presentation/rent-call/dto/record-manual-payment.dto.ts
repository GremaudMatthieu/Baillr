import { IsInt, Min, Max, IsDateString, IsNotEmpty, IsString, MaxLength, IsEnum, IsOptional, ValidateIf } from 'class-validator';

export class RecordManualPaymentDto {
  @IsInt()
  @Min(1)
  @Max(99999999)
  amountCents!: number;

  @IsEnum(['cash', 'check'])
  paymentMethod!: 'cash' | 'check';

  @IsDateString()
  paymentDate!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  payerName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ValidateIf((o: RecordManualPaymentDto) => o.paymentMethod === 'check')
  paymentReference?: string;
}
