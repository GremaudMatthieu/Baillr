import { IsString, IsNotEmpty, Matches, MaxLength } from 'class-validator';

export class GetDashboardKpisDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(7)
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'month must be in YYYY-MM format' })
  month!: string;
}
