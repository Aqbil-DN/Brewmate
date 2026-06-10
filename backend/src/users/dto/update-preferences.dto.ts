import {
  IsOptional,
  IsArray,
  IsString,
  IsBoolean,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { OrderType } from '@prisma/client';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergenTags?: string[];

  @IsOptional()
  @IsEnum(OrderType, {
    message: 'defaultOrderType must be one of: dine_in, takeaway, pickup',
  })
  defaultOrderType?: OrderType;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Payment method cannot exceed 50 characters' })
  defaultPaymentMethod?: string;

  @IsOptional()
  @IsBoolean()
  aiNotificationsEnabled?: boolean;
}
