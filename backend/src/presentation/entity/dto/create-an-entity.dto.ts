import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto } from './address.dto.js';

export class CreateAnEntityDto {
  @IsUUID()
  id!: string;

  @IsEnum(['sci', 'nom_propre'])
  type!: 'sci' | 'nom_propre';

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsOptional()
  @IsString()
  @Length(14, 14)
  @Matches(/^\d{14}$/, { message: 'SIRET must be 14 digits' })
  siret?: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address!: AddressDto;

  @IsOptional()
  @IsString()
  legalInformation?: string;
}
