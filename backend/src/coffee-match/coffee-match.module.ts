import { Module } from '@nestjs/common';
import { CoffeeMatchController } from './coffee-match.controller.js';
import { CoffeeMatchService } from './coffee-match.service.js';
import { RecommendationScoringService } from './recommendation-scoring.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CartModule } from '../cart/cart.module.js';

@Module({
  imports: [PrismaModule, CartModule],
  controllers: [CoffeeMatchController],
  providers: [CoffeeMatchService, RecommendationScoringService],
})
export class CoffeeMatchModule {}
