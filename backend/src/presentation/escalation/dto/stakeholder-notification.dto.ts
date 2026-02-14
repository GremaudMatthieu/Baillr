import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class StakeholderNotificationDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['insurance', 'lawyer', 'guarantor'])
  recipientType!: 'insurance' | 'lawyer' | 'guarantor';
}
