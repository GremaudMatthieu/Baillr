import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BillableOptionDto } from './billable-option.dto.js';

export class UpdateAUnitDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  identifier?: string;

  @IsOptional()
  @IsString()
  @IsIn(['apartment', 'parking', 'commercial', 'storage'])
  type?: string;

  @ValidateIf((o: UpdateAUnitDto) => o.floor !== undefined && o.floor !== null)
  @IsInt()
  floor?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(99999)
  surfaceArea?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => BillableOptionDto)
  billableOptions?: BillableOptionDto[];
}
