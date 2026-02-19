import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ALERT_TYPES } from '../alert-type.enum.js';

class AlertPreferenceItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsIn(ALERT_TYPES)
  alertType!: string;

  @IsBoolean()
  enabled!: boolean;
}

export class UpdateAlertPreferencesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AlertPreferenceItemDto)
  preferences!: AlertPreferenceItemDto[];
}
