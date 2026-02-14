import { IsNotEmpty, Matches } from 'class-validator';

export class MatchPaymentsQueryDto {
  @IsNotEmpty({ message: 'Month is required' })
  @Matches(/^\d{4}-\d{2}$/, { message: 'Month must be in YYYY-MM format' })
  month!: string;
}
