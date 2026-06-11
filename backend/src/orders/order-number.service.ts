import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class OrderNumberService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a unique order number in the format: BRW-YYYYMMDD-XXXX
   * E.g., BRW-20260101-0001
   */
  async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    
    const prefix = `BRW-${datePrefix}-`;

    // MVP implementation: count orders today and increment
    // Note: For high concurrency, a sequence table or atomic counter is better,
    // but for MVP counting today's orders is sufficient.
    
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const count = await this.prisma.order.count({
      where: {
        placedAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    // If count is 0, start at 1. Pad to 4 digits.
    const sequence = String(count + 1).padStart(4, '0');
    
    let orderNumber = `${prefix}${sequence}`;

    // Handle collision explicitly (just in case of race conditions without locks)
    let isUnique = false;
    let attempts = 0;
    let currentSequence = count + 1;

    while (!isUnique && attempts < 5) {
      const existing = await this.prisma.order.findUnique({
        where: { orderNumber },
      });

      if (!existing) {
        isUnique = true;
      } else {
        currentSequence++;
        const nextSeq = String(currentSequence).padStart(4, '0');
        orderNumber = `${prefix}${nextSeq}`;
        attempts++;
      }
    }

    if (!isUnique) {
      // Fallback: append a random string to guarantee uniqueness
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      orderNumber = `${prefix}${String(currentSequence).padStart(4, '0')}-${random}`;
    }

    return orderNumber;
  }
}
