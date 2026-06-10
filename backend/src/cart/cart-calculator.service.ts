import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface CartItemInput {
  id: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  productId: string;
  variantId: string | null;
  product: {
    name: string;
    imageUrl: string | null;
    isAvailable: boolean;
  };
  variant: {
    name: string;
    isAvailable: boolean;
  } | null;
  specialInstructions: string | null;
}

@Injectable()
export class CartCalculatorService {
  calculateCart(cartId: string, items: CartItemInput[]) {
    let itemCount = 0;
    let subtotal = 0;

    const formattedItems = items.map((item) => {
      const unitPriceNum = Number(item.unitPrice.toString());
      const lineSubtotal = item.quantity * unitPriceNum;

      itemCount += item.quantity;
      subtotal += lineSubtotal;

      const isItemAvailable =
        item.product.isAvailable &&
        (item.variant ? item.variant.isAvailable : true);

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        name: item.product.name,
        imageUrl: item.product.imageUrl,
        variantName: item.variant ? item.variant.name : null,
        quantity: item.quantity,
        unitPrice: unitPriceNum,
        lineSubtotal,
        specialInstructions: item.specialInstructions,
        isAvailable: isItemAvailable,
      };
    });

    const discountAmount = 0; // For MVP
    const taxAmount = 0; // For MVP
    const totalAmount = subtotal - discountAmount + taxAmount;

    return {
      id: cartId,
      items: formattedItems,
      itemCount,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
    };
  }
}
