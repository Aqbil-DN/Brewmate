import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'Label is required' })
  @MaxLength(50, { message: 'Label cannot exceed 50 characters' })
  label!: string;

  @IsString()
  @IsNotEmpty({ message: 'Full address is required' })
  fullAddress!: string;

  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  @MaxLength(100, { message: 'City cannot exceed 100 characters' })
  city!: string;

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
