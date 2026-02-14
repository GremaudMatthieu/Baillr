import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsIn,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class RecordAnInseeIndexDto {
  @IsNotEmpty()
  @IsUUID()
  id!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(3)
  @IsIn(['IRL', 'ILC', 'ICC'])
  type!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2)
  @IsIn(['Q1', 'Q2', 'Q3', 'Q4'])
  quarter!: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @IsNumber()
  @Min(0.001)
  @Max(500)
  value!: number;
}
