import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CartCalculatorService } from './cart-calculator.service.js';
import { AddCartItemDto } from './dto/add-cart-item.dto.js';
import { UpdateCartItemDto } from './dto/update-cart-item.dto.js';
import { AppErrorCodes } from '../common/errors/app-error-codes.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: CartCalculatorService,
  ) {}

  /**
   * Retrieves the current user's cart or creates one if it doesn't exist.
   */
  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        cartItems: {
          include: {
            product: {
              select: { name: true, imageUrl: true, isAvailable: true },
            },
            variant: { select: { name: true, isAvailable: true } },
          },
          orderBy: { addedAt: 'asc' },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: { cartItems: { include: { product: true, variant: true } } },
      });
    }

    return this.calculator.calculateCart(cart.id, cart.cartItems as any);
  }

  /**
   * Adds an item to the cart. Creates the cart if needed.
   * Calculates the correct unit price from DB, ignoring frontend price.
   */
  async addItem(userId: string, dto: AddCartItemDto) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    // Validate product
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { productVariants: true },
    });

    if (!product) {
      throw new NotFoundException({
        code: AppErrorCodes.PRODUCT_NOT_FOUND,
        message: 'Product not found.',
      });
    }

    if (product.status !== 'active' || !product.isAvailable) {
      throw new BadRequestException({
        code: AppErrorCodes.PRODUCT_UNAVAILABLE,
        message: 'Product is currently unavailable.',
      });
    }

    let finalVariantId: string | null = null;
    let unitPrice = Number(product.basePrice.toString());

    if (dto.variantId) {
      const variant = product.productVariants.find(
        (v) => v.id === dto.variantId,
      );
      if (!variant) {
        throw new NotFoundException({
          code: AppErrorCodes.PRODUCT_VARIANT_NOT_FOUND,
          message: 'Product variant not found.',
        });
      }
      if (!variant.isAvailable) {
        throw new BadRequestException({
          code: AppErrorCodes.PRODUCT_VARIANT_UNAVAILABLE,
          message: 'Product variant is currently unavailable.',
        });
      }
      finalVariantId = variant.id;
      unitPrice += Number(variant.priceModifier.toString());
    } else {
      // Use default variant if product has one
      const defaultVariant = product.productVariants.find((v) => v.isDefault);
      if (defaultVariant) {
        finalVariantId = defaultVariant.id;
        unitPrice += Number(defaultVariant.priceModifier.toString());
      }
    }

    // Check if same item already exists in cart
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: finalVariantId,
      },
    });

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + dto.quantity,
          ...(dto.specialInstructions !== undefined && {
            specialInstructions: dto.specialInstructions,
          }),
        },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: finalVariantId,
          quantity: dto.quantity,
          unitPrice: new Prisma.Decimal(unitPrice),
          specialInstructions: dto.specialInstructions,
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Updates cart item quantity or special instructions.
   */
  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
    });

    if (!item) {
      throw new NotFoundException({
        code: AppErrorCodes.CART_ITEM_NOT_FOUND,
        message: 'Cart item not found.',
      });
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        ...(dto.quantity !== undefined && { quantity: dto.quantity }),
        ...(dto.specialInstructions !== undefined && {
          specialInstructions: dto.specialInstructions,
        }),
      },
    });

    return this.getCart(userId);
  }

  /**
   * Removes an item from the cart.
   */
  async removeItem(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
    });

    if (!item) {
      throw new NotFoundException({
        code: AppErrorCodes.CART_ITEM_NOT_FOUND,
        message: 'Cart item not found.',
      });
    }

    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  /**
   * Clears all items from the current user's cart.
   */
  async clearCart(userId: string) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.getCart(userId);
  }
}
