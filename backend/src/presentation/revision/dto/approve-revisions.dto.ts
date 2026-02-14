import { IsArray, IsString, IsNotEmpty, ArrayMinSize, MaxLength } from 'class-validator';

export class ApproveRevisionsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(1)
  @MaxLength(36, { each: true })
  revisionIds!: string[];
}
