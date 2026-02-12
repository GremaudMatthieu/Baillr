import {
  IsOptional,
  IsString,
  Length,
  MaxLength,
  IsEmail,
  IsDateString,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostalAddressDto } from './postal-address.dto.js';

export class UpdateATenantDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @ValidateIf((_o, value) => value !== null)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string | null;

  @ValidateIf((_o, value) => value !== null)
  @IsOptional()
  @IsString()
  @Matches(/^\d{14}$/, { message: 'SIRET must be 14 digits' })
  siret?: string | null;

  @IsOptional()
  @IsString()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ValidateIf((_o, value) => value !== null)
  @IsOptional()
  @IsString()
  @Matches(/^(\+33|0)[1-9]\d{8}$/, { message: 'Phone number must be valid French format' })
  phoneNumber?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => PostalAddressDto)
  address?: PostalAddressDto;

  @ValidateIf((_o, value) => value !== null)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  insuranceProvider?: string | null;

  @ValidateIf((_o, value) => value !== null)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyNumber?: string | null;

  @ValidateIf((_o, value) => value !== null)
  @IsOptional()
  @IsDateString()
  renewalDate?: string | null;
}
