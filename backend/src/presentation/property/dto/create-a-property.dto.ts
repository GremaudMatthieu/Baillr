import { IsOptional, IsString, IsUUID, Length, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyAddressDto } from './property-address.dto.js';

export class CreateAPropertyDto {
  @IsUUID()
  id!: string;

  @IsString()
  @Length(1, 255)
  name!: string;

  @ValidateNested()
  @Type(() => PropertyAddressDto)
  address!: PropertyAddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  type?: string;
}
