import { IsUUID, IsNotEmpty, IsInt, IsDateString, IsOptional, MaxLength, Min } from 'class-validator';

export class ValidateMatchDto {
  @IsUUID()
  transactionId!: string;

  @IsUUID()
  rentCallId!: string;

  @IsInt()
  @Min(1)
  amountCents!: number;

  @IsNotEmpty()
  @MaxLength(255)
  payerName!: string;

  @IsDateString()
  paymentDate!: string;

  @IsOptional()
  @IsUUID()
  bankStatementId?: string;
}
