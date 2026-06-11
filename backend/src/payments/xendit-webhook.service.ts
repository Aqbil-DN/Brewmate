import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentStatus, OrderStatus, Prisma } from '@prisma/client';

@Injectable()
export class XenditWebhookService {
  private readonly logger = new Logger(XenditWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Main entry point for webhook processing.
   */
  async processWebhook(payload: any) {
    const unwrapped = this.unwrapPayload(payload);
    const reference = this.extractReference(unwrapped);
    const mappedStatus = this.mapXenditStatusToPaymentStatus(unwrapped);

    this.logger.log(`Processing webhook: mappedStatus=${mappedStatus}, ref=${reference}`);

    if (!reference) {
      this.logger.warn('Webhook payload missing valid reference/external_id');
      return { success: true, message: 'Missing reference' };
    }

    // 3. Find matching order
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [
          { paymentReference: unwrapped.id },
          { paymentReference: unwrapped.invoice_id },
          { orderNumber: unwrapped.external_id },
          { orderNumber: unwrapped.reference_id },
          { paymentReference: unwrapped.external_id },
          { paymentReference: unwrapped.reference_id },
        ],
      },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      this.logger.warn(`Order not found for reference: ${reference}`);
      return { success: true, message: 'Webhook received but order was not found.' };
    }

    // 5. Idempotency Check
    if (order.paymentStatus === mappedStatus) {
      this.logger.log(`Order ${order.orderNumber} already has paymentStatus ${mappedStatus}. Skipping.`);
      return { success: true, message: 'Already processed' };
    }

    // Process based on status
    if (mappedStatus === 'paid') {
      await this.processPaidOrder(order, unwrapped);
    } else if (mappedStatus === 'failed') {
      await this.processFailedOrder(order);
    } else if (mappedStatus === 'expired') {
      await this.processExpiredOrder(order);
    } else if (mappedStatus === 'refunded') {
      await this.processRefundedOrder(order);
    } else {
      // Pending or unknown
      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: mappedStatus as PaymentStatus },
      });
    }

    return {
      success: true,
      data: {
        received: true,
        orderNumber: order.orderNumber,
        paymentStatus: mappedStatus,
      },
    };
  }

  private unwrapPayload(payload: any): any {
    if (payload.data && typeof payload.data === 'object' && payload.event) {
      return { ...payload.data, _event: payload.event };
    }
    return payload;
  }

  private extractReference(payload: any): string | null {
    return payload.external_id || payload.reference_id || payload.invoice_id || payload.id || null;
  }

  private mapXenditStatusToPaymentStatus(payload: any): PaymentStatus {
    const status = (payload.status || '').toUpperCase();
    const event = (payload._event || '').toLowerCase();

    // Paid
    if (
      ['PAID', 'SETTLED', 'SUCCEEDED', 'SUCCESS', 'COMPLETED'].includes(status) ||
      event.includes('.paid') ||
      event.includes('.succeeded')
    ) {
      return 'paid';
    }

    // Failed
    if (['FAILED', 'CANCELLED'].includes(status) || event.includes('.failed')) {
      return 'failed';
    }

    // Expired
    if (['EXPIRED'].includes(status) || event.includes('.expired')) {
      return 'expired';
    }

    // Refunded
    if (['REFUNDED'].includes(status) || event.includes('.refunded')) {
      return 'refunded';
    }

    // Default to pending
    return 'pending';
  }

  private async processPaidOrder(order: any, payload: any) {
    await this.prisma.$transaction(async (tx) => {
      // Re-fetch to ensure atomicity
      const currentOrder = await tx.order.findUnique({
        where: { id: order.id },
      });

      if (currentOrder?.paymentStatus === 'paid') return;

      // Update Order
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'paid',
          status: 'confirmed',
        },
      });

      // Clear Cart
      const cart = await tx.cart.findUnique({
        where: { userId: order.userId },
      });
      if (cart) {
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }

      // Promo Uses
      if (order.promoCode) {
        // Find promo first to ensure it's valid
        const promo = await tx.promotion.findFirst({
          where: { code: { equals: order.promoCode, mode: 'insensitive' } },
        });
        if (promo) {
          await tx.promotion.update({
            where: { id: promo.id },
            data: { currentUses: { increment: 1 } },
          });
        }
      }

      // Loyalty Stamps
      const existingStamp = await tx.loyaltyStamp.findFirst({
        where: { orderId: order.id },
      });

      if (!existingStamp) {
        // Get user's latest balance
        const latestStamp = await tx.loyaltyStamp.findFirst({
          where: { userId: order.userId },
          orderBy: { earnedAt: 'desc' },
        });
        const prevBalance = latestStamp ? latestStamp.stampsBalance : 0;

        await tx.loyaltyStamp.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            stampsEarned: 1,
            stampsBalance: prevBalance + 1,
          },
        });
      }

      // AI Quiz Sessions logic
      const aiSession = await tx.aiQuizSession.findFirst({
        where: { resultingOrderId: order.id },
      });

      if (aiSession) {
        await tx.aiQuizSession.update({
          where: { id: aiSession.id },
          data: { resultedInOrder: true },
        });

        // Update recommendation events
        const productIdsInOrder = order.orderItems.map((item: any) => item.productId);
        if (productIdsInOrder.length > 0) {
          await tx.aiRecommendationEvent.updateMany({
            where: {
              sessionId: aiSession.id,
              productId: { in: productIdsInOrder },
            },
            data: { wasPurchased: true },
          });
        }
      }
    });
  }

  private async processFailedOrder(order: any) {
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'failed',
        status: 'cancelled',
      },
    });
  }

  private async processExpiredOrder(order: any) {
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'expired',
        status: 'cancelled',
      },
    });
  }

  private async processRefundedOrder(order: any) {
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'refunded',
      },
    });
  }
}
