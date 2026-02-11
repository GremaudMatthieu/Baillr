import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class PropertyAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  street!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{5}$/, { message: 'Postal code must be 5 digits' })
  postalCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  city!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  complement?: string | null;
}
