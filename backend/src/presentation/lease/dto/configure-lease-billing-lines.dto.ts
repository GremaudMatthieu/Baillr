import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsString,
  IsUUID,
  IsNotEmpty,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class BillingLineDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  chargeCategoryId!: string;

  @IsInt()
  @Min(0)
  @Max(99999999)
  amountCents!: number;
}

export class ConfigureLeaseBillingLinesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(50)
  @Type(() => BillingLineDto)
  billingLines!: BillingLineDto[];
}
