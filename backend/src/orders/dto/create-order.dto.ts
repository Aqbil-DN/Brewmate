import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  IsUUID,
} from 'class-validator';

export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
}

export class CreateOrderDto {
  @IsEnum(OrderType)
  orderType!: OrderType;

  @IsString()
  paymentMethod!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  promoCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialNotes?: string;

  @IsOptional()
  @IsUUID()
  addressId?: string;

  @IsOptional()
  @IsUUID()
  aiSessionId?: string;
}
