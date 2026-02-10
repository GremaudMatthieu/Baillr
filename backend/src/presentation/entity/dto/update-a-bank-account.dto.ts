import { IsBoolean, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class UpdateABankAccountDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  label?: string;

  @IsOptional()
  @IsString()
  @Matches(/^FR\d{2}[A-Z0-9]{23}$/, { message: 'IBAN format is invalid' })
  iban?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, { message: 'BIC format is invalid' })
  bic?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankName?: string | null;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
