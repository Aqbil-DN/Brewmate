import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class AddRecommendationToCartDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  quantity?: number = 1;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsOptional()
  @IsString()
  specialInstructions?: string;
}
