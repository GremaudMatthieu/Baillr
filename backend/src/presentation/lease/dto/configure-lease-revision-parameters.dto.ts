import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsIn,
  IsNumber,
  IsOptional,
  MaxLength,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';

export class ConfigureLeaseRevisionParametersDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(31)
  revisionDay!: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(12)
  revisionMonth!: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2)
  @IsIn(['Q1', 'Q2', 'Q3', 'Q4'])
  referenceQuarter!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(2000)
  @Max(2100)
  referenceYear!: number;

  @IsOptional()
  @ValidateIf((_o, value) => value !== null)
  @IsNumber()
  @Min(0.001)
  baseIndexValue?: number | null;
}
