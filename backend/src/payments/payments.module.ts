import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { XenditService } from './xendit.service.js';
import { XenditWebhookService } from './xendit-webhook.service.js';
import { PaymentsController } from './payments.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { LoyaltyModule } from '../loyalty/loyalty.module.js';

@Module({
  imports: [ConfigModule, PrismaModule, LoyaltyModule],
  controllers: [PaymentsController],
  providers: [XenditService, XenditWebhookService],
  exports: [XenditService, XenditWebhookService],
})
export class PaymentsModule {}
