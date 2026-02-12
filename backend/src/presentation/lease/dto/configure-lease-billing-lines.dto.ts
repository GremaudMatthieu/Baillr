import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsString,
  IsIn,
  MaxLength,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  MinLength,
} from 'class-validator';

export class BillingLineDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label!: string;

  @IsInt()
  @Min(0)
  @Max(99999999)
  amountCents!: number;

  @IsString()
  @IsIn(['provision', 'option'])
  type!: string;
}

export class ConfigureLeaseBillingLinesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(50)
  @Type(() => BillingLineDto)
  billingLines!: BillingLineDto[];
}
