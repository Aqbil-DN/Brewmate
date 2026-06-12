import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CartService } from '../cart/cart.service.js';
import { PromotionsService } from '../promotions/promotions.service.js';
import { XenditService } from '../payments/xendit.service.js';
import { OrderNumberService } from './order-number.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { AppErrorCodes } from '../common/errors/app-error-codes.js';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly promotionsService: PromotionsService,
    private readonly xenditService: XenditService,
    private readonly orderNumberService: OrderNumberService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    // 1. Get current user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException({
        code: AppErrorCodes.USER_NOT_FOUND,
        message: 'User not found.',
      });
    }

    // 2. Get current cart
    const cartData = await this.cartService.getCart(userId);
    if (!cartData || cartData.itemCount === 0 || cartData.items.length === 0) {
      throw new BadRequestException({
        code: AppErrorCodes.CART_EMPTY,
        message: 'Your cart is empty.',
      });
    }

    // 3. Validate Address if provided
    if (dto.addressId) {
      const address = await this.prisma.address.findFirst({
        where: { id: dto.addressId, userId },
      });
      if (!address) {
        throw new NotFoundException({
          code: AppErrorCodes.ADDRESS_NOT_FOUND,
          message: 'Address not found or does not belong to you.',
        });
      }
    }

    // 4. Validate Cart Items
    const validItemsForOrder: any[] = [];
    for (const cartItem of cartData.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: cartItem.productId },
      });

      if (!product || product.status !== 'active' || !product.isAvailable) {
        throw new BadRequestException({
          code: AppErrorCodes.PRODUCT_UNAVAILABLE,
          message: `Product ${cartItem.name} is no longer available.`,
        });
      }

      let variantName: string | null = null;
      if (cartItem.variantId) {
        const variant = await this.prisma.productVariant.findUnique({
          where: { id: cartItem.variantId },
        });
        if (
          !variant ||
          variant.productId !== product.id ||
          !variant.isAvailable
        ) {
          throw new BadRequestException({
            code: AppErrorCodes.PRODUCT_VARIANT_UNAVAILABLE,
            message: `Variant ${cartItem.variantName} for product ${cartItem.name} is no longer available.`,
          });
        }
        variantName = variant.name;
      }

      validItemsForOrder.push({
        productId: product.id,
        variantId: cartItem.variantId,
        productNameSnapshot: product.name,
        variantNameSnapshot: variantName,
        unitPriceSnapshot: new Prisma.Decimal(cartItem.unitPrice),
        quantity: cartItem.quantity,
        specialInstructions: cartItem.specialInstructions,
      });
    }

    // 5. Calculate Subtotal & Promo
    let discountAmount = 0;
    let finalSubtotal = cartData.subtotal;
    let appliedPromoCode: string | null = null;

    if (dto.promoCode) {
      const promoResult =
        await this.promotionsService.validateAndCalculatePromo({
          code: dto.promoCode,
          cartSubtotal: cartData.subtotal,
        });
      discountAmount = promoResult.discountAmount;
      finalSubtotal = promoResult.finalSubtotal;
      appliedPromoCode = promoResult.code;
    }

    // 6. Tax Calculation (MVP 0)
    const taxAmount = 0;
    const totalAmount = Math.max(0, finalSubtotal + taxAmount);

    // 7. Order Number
    const orderNumber = await this.orderNumberService.generateOrderNumber();

    // 8. DB Transaction to create Order
    const order = await this.prisma.$transaction(async (tx) => {
      // If AI Session provided, verify it belongs to user
      if (dto.aiSessionId) {
        const aiSession = await tx.aiQuizSession.findUnique({
          where: { id: dto.aiSessionId },
        });
        if (aiSession && aiSession.userId && aiSession.userId !== userId) {
          throw new ForbiddenException({
            code: AppErrorCodes.FORBIDDEN,
            message: 'You do not own this AI session.',
          });
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          userId,
          addressId: dto.addressId || null,
          orderNumber,
          orderType: dto.orderType as any,
          status: 'pending',
          paymentStatus: 'pending',
          paymentMethod: dto.paymentMethod,
          paymentReference: null,
          subtotal: new Prisma.Decimal(cartData.subtotal),
          discountAmount: new Prisma.Decimal(discountAmount),
          taxAmount: new Prisma.Decimal(taxAmount),
          totalAmount: new Prisma.Decimal(totalAmount),
          promoCode: appliedPromoCode,
          specialNotes: dto.specialNotes,
          orderItems: {
            create: validItemsForOrder,
          },
        },
        include: {
          orderItems: true,
        },
      });

      // Update AI session resultingOrderId if provided
      if (dto.aiSessionId) {
        await tx.aiQuizSession.updateMany({
          where: { id: dto.aiSessionId },
          data: { resultingOrderId: createdOrder.id },
        });
      }

      return createdOrder;
    });

    // 9. Generate Xendit Link Outside Transaction
    let paymentResult;
    try {
      paymentResult = await this.xenditService.createPaymentLinkForOrder({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: totalAmount,
        customerName: user.fullName,
        customerEmail: user.email,
        customerPhone: user.phoneNumber,
        description: `BrewMate AI Order ${order.orderNumber}`,
        items: validItemsForOrder.map((item) => ({
          name: item.variantNameSnapshot
            ? `${item.productNameSnapshot} (${item.variantNameSnapshot})`
            : item.productNameSnapshot,
          quantity: item.quantity,
          price: Number(item.unitPriceSnapshot.toString()),
        })),
      });
    } catch (error) {
      // If payment fails, mark order as failed but keep it
      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'failed' },
      });
      // Re-throw
      throw error;
    }

    // 10. Update order with payment reference
    await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentReference: paymentResult.paymentReference },
    });

    // 11. Format final response
    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        subtotal: Number(order.subtotal.toString()),
        discountAmount: Number(order.discountAmount.toString()),
        taxAmount: Number(order.taxAmount.toString()),
        totalAmount: Number(order.totalAmount.toString()),
        promoCode: order.promoCode,
        placedAt: order.placedAt,
      },
      payment: {
        provider: paymentResult.provider,
        paymentReference: paymentResult.paymentReference,
        paymentUrl: paymentResult.paymentUrl,
      },
    };
  }

  async getUserOrders(
    userId: string,
    page = 1,
    limit = 20,
    status?: string,
    paymentStatus?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      userId,
      ...(status && { status: status as OrderStatus }),
      ...(paymentStatus && { paymentStatus: paymentStatus as PaymentStatus }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { placedAt: 'desc' },
        include: {
          orderItems: {
            take: 3, // Preview up to 3 items
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    const formattedItems = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      totalAmount: Number(o.totalAmount.toString()),
      placedAt: o.placedAt,
      itemsPreview: o.orderItems.map((item) => ({
        productName: item.productNameSnapshot,
        quantity: item.quantity,
      })),
    }));

    return {
      items: formattedItems,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderDetail(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        orderItems: true,
        address: true,
      },
    });

    if (!order) {
      throw new NotFoundException({
        code: AppErrorCodes.ORDER_NOT_FOUND,
        message: 'Order not found.',
      });
    }

    return {
      ...order,
      subtotal: Number(order.subtotal.toString()),
      discountAmount: Number(order.discountAmount.toString()),
      taxAmount: Number(order.taxAmount.toString()),
      totalAmount: Number(order.totalAmount.toString()),
      orderItems: order.orderItems.map((item) => ({
        ...item,
        unitPriceSnapshot: Number(item.unitPriceSnapshot.toString()),
      })),
    };
  }

  async reorder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { orderItems: true },
    });

    if (!order) {
      throw new NotFoundException({
        code: AppErrorCodes.ORDER_NOT_FOUND,
        message: 'Order not found.',
      });
    }

    const addedItems: any[] = [];
    const skippedItems: any[] = [];

    for (const item of order.orderItems) {
      try {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product || product.status !== 'active' || !product.isAvailable) {
          skippedItems.push({
            productName: item.productNameSnapshot,
            reason: 'Product unavailable',
          });
          continue;
        }

        if (item.variantId) {
          const variant = await this.prisma.productVariant.findUnique({
            where: { id: item.variantId },
          });
          if (!variant || !variant.isAvailable) {
            skippedItems.push({
              productName: item.productNameSnapshot,
              reason: 'Product variant unavailable',
            });
            continue;
          }
        }

        await this.cartService.addItem(userId, {
          productId: item.productId,
          variantId: item.variantId || undefined,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || undefined,
        });

        addedItems.push({
          productName: item.productNameSnapshot,
          quantity: item.quantity,
        });
      } catch (error) {
        skippedItems.push({
          productName: item.productNameSnapshot,
          reason: 'Failed to add item',
        });
      }
    }

    const updatedCart = await this.cartService.getCart(userId);

    return {
      cart: updatedCart,
      addedItems,
      skippedItems,
    };
  }
}
