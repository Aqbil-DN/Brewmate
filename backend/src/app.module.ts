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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

