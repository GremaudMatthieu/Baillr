import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class PostalAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  street?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{5}$/, { message: 'Postal code must be 5 digits' })
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  complement?: string;
}
