import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { validate } from './config/env.validation.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { ProductsModule } from './products/products.module.js';
import { CartModule } from './cart/cart.module.js';
import { PromotionsModule } from './promotions/promotions.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { LoyaltyModule } from './loyalty/loyalty.module.js';
import { CoffeeMatchModule } from './coffee-match/coffee-match.module.js';
import { AiModule } from './ai/ai.module.js';

@Module({
  imports: [
    // ── Configuration ────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      envFilePath: '.env',
    }),

    // ── Database ─────────────────────────────────────────
    PrismaModule,

    // ── Authentication ───────────────────────────────────
    AuthModule,

    // ── User Profile, Preferences & Addresses ────────────
    UsersModule,

    // ── Product Catalogue ────────────────────────────────
    ProductsModule,

    // ── Cart ─────────────────────────────────────────────
    CartModule,

    // ── Promotions ───────────────────────────────────────
    PromotionsModule,

    // ── Payments ─────────────────────────────────────────
    PaymentsModule,

    // ── Orders ───────────────────────────────────────────
    OrdersModule,

    // ── Loyalty ──────────────────────────────────────────
    LoyaltyModule,

    // ── Coffee Match ─────────────────────────────────────
    CoffeeMatchModule,

    // ── AI Services ──────────────────────────────────────
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

