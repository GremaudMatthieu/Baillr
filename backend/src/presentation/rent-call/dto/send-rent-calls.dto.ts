import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';

export class SendRentCallsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(7)
  @Matches(/^\d{4}-\d{2}$/, { message: 'Month must be in YYYY-MM format' })
  month!: string;
}
