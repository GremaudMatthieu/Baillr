import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsUUID,
  IsArray,
  IsDateString,
  Min,
  Max,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MeterReadingDto {
  @IsUUID()
  unitId!: string;

  @IsInt()
  @Min(0)
  @Max(99_999_999)
  previousReading!: number;

  @IsInt()
  @Min(0)
  @Max(99_999_999)
  currentReading!: number;

  @IsDateString()
  @IsNotEmpty()
  readingDate!: string;
}

export class RecordWaterMeterReadingsDto {
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
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => MeterReadingDto)
  readings!: MeterReadingDto[];
}
