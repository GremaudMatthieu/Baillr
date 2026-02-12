import { IsString, IsNotEmpty, Matches, MaxLength } from 'class-validator';

export class GenerateRentCallsForMonthDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(7)
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format' })
  month!: string;
}
