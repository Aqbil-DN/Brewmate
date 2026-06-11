import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { OrderNumberService } from './order-number.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CartModule } from '../cart/cart.module.js';
import { PromotionsModule } from '../promotions/promotions.module.js';
import { PaymentsModule } from '../payments/payments.module.js';

@Module({
  imports: [PrismaModule, CartModule, PromotionsModule, PaymentsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderNumberService],
  exports: [OrdersService],
})
export class OrdersModule {}
