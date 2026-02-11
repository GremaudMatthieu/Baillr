import { IsInt, IsString, Length, Max, Min } from 'class-validator';

export class BillableOptionDto {
  @IsString()
  @Length(1, 100)
  label!: string;

  @IsInt()
  @Min(0)
  @Max(99999999)
  amountCents!: number;
}
