import { IsString, IsNotEmpty, IsInt, Min, Max, MaxLength } from 'class-validator';

export class CalculateChargeRegularizationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  id!: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  fiscalYear!: number;
}
