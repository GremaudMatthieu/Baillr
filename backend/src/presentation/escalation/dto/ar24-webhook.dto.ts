import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class Ar24WebhookDto {
  @IsString()
  @IsNotEmpty()
  id_mail!: string;

  @IsString()
  @IsNotEmpty()
  new_state!: string;

  @IsOptional()
  @IsString()
  proof_url?: string;
}
