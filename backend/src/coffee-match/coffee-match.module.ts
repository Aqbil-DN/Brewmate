import { Module } from '@nestjs/common';
import { CoffeeMatchController } from './coffee-match.controller.js';
import { CoffeeMatchService } from './coffee-match.service.js';
import { RecommendationScoringService } from './recommendation-scoring.service.js';
import { ChatIntentParserService } from './chat-intent-parser.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CartModule } from '../cart/cart.module.js';
import { AiModule } from '../ai/ai.module.js';

@Module({
  imports: [PrismaModule, CartModule, AiModule],
  controllers: [CoffeeMatchController],
  providers: [CoffeeMatchService, RecommendationScoringService, ChatIntentParserService],
})
export class CoffeeMatchModule {}
