import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Reusable pagination query DTO.
 *
 * Usage in controllers:
 *   @Query() query: PaginationQueryDto
 *
 * Defaults: page=1, limit=20, max limit=100
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  /**
   * Calculate the offset for database queries.
   */
  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
