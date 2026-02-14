import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsIn,
  IsArray,
  Min,
  Max,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChargeEntryDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['water', 'electricity', 'teom', 'cleaning', 'custom'])
  category!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label!: string;

  @IsInt()
  @Min(0)
  @Max(99999999)
  amountCents!: number;
}

export class RecordAnnualChargesDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  id!: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  fiscalYear!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ChargeEntryDto)
  charges!: ChargeEntryDto[];
}
