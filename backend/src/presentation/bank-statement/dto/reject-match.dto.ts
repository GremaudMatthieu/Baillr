import { IsUUID } from 'class-validator';

export class RejectMatchDto {
  @IsUUID()
  transactionId!: string;
}
