import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ImportBankStatementDto {
  @IsUUID()
  @IsNotEmpty()
  bankAccountId!: string;

  @IsOptional()
  @IsString()
  mapping?: string; // JSON stringified ColumnMapping — parsed by controller
}
