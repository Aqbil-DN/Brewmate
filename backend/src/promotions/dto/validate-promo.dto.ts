import { IsString, MaxLength, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class ValidatePromoDto {
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  code!: string;

  @IsNumber()
  @Min(0)
  cartSubtotal!: number;
}
