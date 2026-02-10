import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, Length, Matches, MaxLength } from 'class-validator';

export class AddABankAccountDto {
  @IsUUID()
  accountId!: string;

  @IsIn(['bank_account', 'cash_register'])
  type!: 'bank_account' | 'cash_register';

  @IsString()
  @Length(1, 100)
  label!: string;

  @IsOptional()
  @IsString()
  @Matches(/^FR\d{2}[A-Z0-9]{23}$/, { message: 'IBAN format is invalid' })
  iban?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, { message: 'BIC format is invalid' })
  bic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @IsBoolean()
  isDefault!: boolean;
}
