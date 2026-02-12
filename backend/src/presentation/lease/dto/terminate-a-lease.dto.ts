import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class TerminateALeaseDto {
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  endDate!: string;
}
