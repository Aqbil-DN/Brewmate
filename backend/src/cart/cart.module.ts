import { Module } from '@nestjs/common';
import { CartService } from './cart.service.js';
import { CartController } from './cart.controller.js';
import { CartCalculatorService } from './cart-calculator.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [CartController],
  providers: [CartService, CartCalculatorService],
  exports: [CartService],
})
export class CartModule {}
