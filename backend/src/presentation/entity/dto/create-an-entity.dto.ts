import {
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

class AddressDto {
  @IsString()
  @IsNotEmpty()
  street!: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 5)
  @Matches(/^\d{5}$/, { message: 'Postal code must be 5 digits' })
  postalCode!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsOptional()
  @IsString()
  complement?: string | null;
}

export class CreateAnEntityDto {
  @IsUUID()
  id!: string;

  @IsEnum(['sci', 'nom_propre'])
  type!: 'sci' | 'nom_propre';

  @IsString()
  @IsNotEmpty()
  name!: string;

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
