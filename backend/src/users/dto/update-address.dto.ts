import {
  IsString,
  IsOptional,
  MaxLength,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Label cannot exceed 50 characters' })
  label?: string;

  @IsOptional()
  @IsString()
  fullAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'City cannot exceed 100 characters' })
  city?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Latitude must be a number' })
  lat?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Longitude must be a number' })
  lng?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
