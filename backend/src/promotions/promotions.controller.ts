import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PromotionsService } from './promotions.service.js';
import { ValidatePromoDto } from './dto/validate-promo.dto.js';

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validatePromo(@Body() dto: ValidatePromoDto) {
    return this.promotionsService.validatePromoAPI(dto);
  }
}
