import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AppErrorCodes } from '../common/errors/app-error-codes.js';
import { Prisma } from '@prisma/client';

export interface ValidatePromoInput {
  code: string;
  cartSubtotal: number | Prisma.Decimal;
}

export interface PromoValidationResult {
  promotionId: string;
  code: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  finalSubtotal: number;
  message: string;
}

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Internal method used by both the public endpoint and the OrdersModule later.
   * Does NOT increment usage. Usage is incremented in webhook on payment success.
   */
  async validateAndCalculatePromo(input: ValidatePromoInput): Promise<PromoValidationResult> {
    const code = input.code.trim().toUpperCase();
    const cartSubtotal = Number(input.cartSubtotal.toString());

    const promo = await this.prisma.promotion.findUnique({
      where: { code },
    });

    if (!promo) {
      throw new NotFoundException({
        code: AppErrorCodes.PROMO_NOT_FOUND,
        message: 'Promo code not found.',
      });
    }

    if (!promo.isActive) {
      throw new BadRequestException({
        code: AppErrorCodes.PROMO_INACTIVE,
        message: 'This promo is not active.',
      });
    }

    const now = new Date();
    if (promo.validFrom && now < promo.validFrom) {
      throw new BadRequestException({
        code: AppErrorCodes.PROMO_NOT_STARTED,
        message: 'This promo is not available yet.',
      });
    }

    if (promo.validUntil && now > promo.validUntil) {
      throw new BadRequestException({
        code: AppErrorCodes.PROMO_EXPIRED,
        message: 'This promo has expired.',
      });
    }

    if (promo.minOrderValue && cartSubtotal < Number(promo.minOrderValue.toString())) {
      throw new BadRequestException({
        code: AppErrorCodes.PROMO_MIN_ORDER_NOT_MET,
        message: 'Minimum order value has not been reached.',
      });
    }

    if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
      throw new BadRequestException({
        code: AppErrorCodes.PROMO_USAGE_LIMIT_REACHED,
        message: 'This promo has reached its usage limit.',
      });
    }

    const discountValue = Number(promo.discountValue.toString());
    let discountAmount = 0;
    let message = 'Promo applied successfully.';

    if (promo.discountType === 'percentage') {
      discountAmount = Math.round((cartSubtotal * discountValue) / 100);
    } else if (promo.discountType === 'fixed_amount') {
      discountAmount = discountValue;
    } else if (promo.discountType === 'free_item') {
      // For MVP, free item logic will be handled manually or in checkout, 0 cash discount.
      discountAmount = 0;
      message = 'Free snack promo is valid. Free item handling will be applied at checkout.';
    }

    // Ensure discount doesn't exceed cart subtotal
    if (discountAmount > cartSubtotal) {
      discountAmount = cartSubtotal;
    }

    const finalSubtotal = cartSubtotal - discountAmount;

    return {
      promotionId: promo.id,
      code: promo.code,
      discountType: promo.discountType,
      discountValue,
      discountAmount,
      finalSubtotal,
      message,
    };
  }

  /**
   * Used by public API endpoint
   */
  async validatePromoAPI(input: ValidatePromoInput) {
    const result = await this.validateAndCalculatePromo(input);
    // Strip internal database ID for public endpoint response
    const { promotionId, ...safeResult } = result;
    return safeResult;
  }
}
