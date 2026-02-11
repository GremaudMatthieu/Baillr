import {
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyAddressDto } from './property-address.dto.js';

export class UpdateAPropertyDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PropertyAddressDto)
  address?: PropertyAddressDto;

  @ValidateIf((_o, value) => value !== null)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  type?: string | null;
}
