import {
  IsUUID,
  IsString,
  IsIn,
  Length,
  MaxLength,
  IsOptional,
  IsEmail,
  IsDateString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostalAddressDto } from './postal-address.dto.js';

export class RegisterATenantDto {
  @IsUUID()
  id!: string;

  @IsString()
  @IsIn(['individual', 'company'])
  type!: string;

  @IsString()
  @Length(1, 100)
  firstName!: string;

  @IsString()
  @Length(1, 100)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{14}$/, { message: 'SIRET must be 14 digits' })
  siret?: string;

  @IsString()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+33|0)[1-9]\d{8}$/, { message: 'Phone number must be valid French format' })
  phoneNumber?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PostalAddressDto)
  address?: PostalAddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  insuranceProvider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyNumber?: string;

  @IsOptional()
  @IsDateString()
  renewalDate?: string;
}
