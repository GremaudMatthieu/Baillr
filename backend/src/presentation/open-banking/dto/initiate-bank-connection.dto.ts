import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class InitiateBankConnectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  institutionId!: string;
}
