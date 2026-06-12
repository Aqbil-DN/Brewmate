import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);
  private readonly REWARD_THRESHOLD = 10;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves the current user's loyalty summary.
   */
  async getLoyaltySummary(userId: string) {
    const latestStamp = await this.prisma.loyaltyStamp.findFirst({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    });

    const balance = latestStamp ? latestStamp.stampsBalance : 0;

    // threshold = 10
    // stampsToNextReward = threshold - (balance % threshold)
    // If balance % threshold === 0 and balance > 0, reward is unlocked!

    let stampsToNextReward =
      this.REWARD_THRESHOLD - (balance % this.REWARD_THRESHOLD);
    let rewardUnlocked = false;

    if (balance > 0 && balance % this.REWARD_THRESHOLD === 0) {
      rewardUnlocked = true;
      stampsToNextReward = 0;
    }

    const totalRewardsEarned = Math.floor(balance / this.REWARD_THRESHOLD);

    let message = `${stampsToNextReward} more stamps to your next free drink.`;
    if (rewardUnlocked) {
      message = 'You have unlocked a free drink reward.';
    }

    return {
      stampsBalance: balance,
      threshold: this.REWARD_THRESHOLD,
      stampsToNextReward,
      rewardUnlocked,
      totalRewardsEarned,
      message,
    };
  }

  /**
   * Retrieves the paginated loyalty history ledger.
   */
  async getLoyaltyHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [stamps, total] = await Promise.all([
      this.prisma.loyaltyStamp.findMany({
        where: { userId },
        orderBy: { earnedAt: 'desc' },
        skip,
        take: limit,
        include: {
          order: {
            select: {
              orderNumber: true,
              totalAmount: true,
              placedAt: true,
            },
          },
        },
      }),
      this.prisma.loyaltyStamp.count({ where: { userId } }),
    ]);

    const items = stamps.map((stamp) => ({
      id: stamp.id,
      orderId: stamp.orderId,
      orderNumber: stamp.order?.orderNumber,
      stampsEarned: stamp.stampsEarned,
      stampsBalance: stamp.stampsBalance,
      earnedAt: stamp.earnedAt,
      source: stamp.orderId ? 'order' : 'other',
    }));

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Internal method called by XenditWebhookService when payment succeeds.
   */
  async awardStampForPaidOrder(
    orderId: string,
    txClient?: Prisma.TransactionClient,
  ) {
    const prisma = txClient || this.prisma;

    // Load order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      this.logger.warn(`Cannot award loyalty: Order ${orderId} not found.`);
      return null;
    }

    if (order.paymentStatus !== 'paid') {
      this.logger.warn(`Cannot award loyalty: Order ${orderId} is not paid.`);
      return null;
    }

    // Idempotency: Check if stamp already exists
    const existingStamp = await prisma.loyaltyStamp.findFirst({
      where: { orderId },
    });

    if (existingStamp) {
      this.logger.log(
        `Loyalty stamp already awarded for order ${orderId}. Skipping.`,
      );
      return existingStamp;
    }

    // Get user's latest balance
    const latestStamp = await prisma.loyaltyStamp.findFirst({
      where: { userId: order.userId },
      orderBy: { earnedAt: 'desc' },
    });

    const prevBalance = latestStamp ? latestStamp.stampsBalance : 0;
    const newBalance = prevBalance + 1;

    // Award stamp
    const newStamp = await prisma.loyaltyStamp.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        stampsEarned: 1,
        stampsBalance: newBalance,
      },
    });

    this.logger.log(
      `Awarded 1 stamp to user ${order.userId} for order ${orderId}. New balance: ${newBalance}`,
    );
    return newStamp;
  }
}
