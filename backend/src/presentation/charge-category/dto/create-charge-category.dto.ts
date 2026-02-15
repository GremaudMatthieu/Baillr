import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateChargeCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  label!: string;
}
