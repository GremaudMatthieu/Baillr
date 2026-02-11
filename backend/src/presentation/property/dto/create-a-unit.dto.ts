import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BillableOptionDto } from './billable-option.dto.js';

export class CreateAUnitDto {
  @IsUUID()
  id!: string;

  @IsString()
  @Length(1, 100)
  identifier!: string;

  @IsString()
  @IsIn(['apartment', 'parking', 'commercial', 'storage'])
  type!: string;

  @IsOptional()
  @IsInt()
  floor?: number;

  @IsNumber()
  @Min(0.01)
  @Max(99999)
  surfaceArea!: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => BillableOptionDto)
  billableOptions?: BillableOptionDto[];
}
