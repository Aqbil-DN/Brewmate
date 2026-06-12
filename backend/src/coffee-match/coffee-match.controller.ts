import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CoffeeMatchService } from './coffee-match.service.js';
import { SubmitQuizDto } from './dto/submit-quiz.dto.js';
import { AddRecommendationToCartDto } from './dto/add-recommendation-to-cart.dto.js';
import { ChatDto } from './dto/chat.dto.js';
import { OptionalJwtAuthGuard } from './guards/optional-jwt.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

interface JwtUser {
  id: string;
}

@Controller('coffee-match')
export class CoffeeMatchController {
  constructor(private readonly coffeeMatchService: CoffeeMatchService) {}

  @Post('chat')
  @UseGuards(OptionalJwtAuthGuard)
  async submitChat(@CurrentUser() user: JwtUser | null, @Body() dto: ChatDto) {
    const userId = user ? user.id : null;
    return this.coffeeMatchService.submitChat(userId, dto);
  }

  @Post('quiz')
  @UseGuards(OptionalJwtAuthGuard)
  async submitQuiz(
    @CurrentUser() user: JwtUser | null,
    @Body() dto: SubmitQuizDto,
  ) {
    const userId = user ? user.id : null;
    return this.coffeeMatchService.submitQuiz(userId, dto);
  }

  @Post('recommendations/:eventId/add-to-cart')
  @UseGuards(JwtAuthGuard)
  async addRecommendationToCart(
    @CurrentUser() user: JwtUser,
    @Param('eventId') eventId: string,
    @Body() dto: AddRecommendationToCartDto,
  ) {
    return this.coffeeMatchService.addToCart(user.id, eventId, dto);
  }

  @Post('sessions/:sessionId/complete')
  @UseGuards(OptionalJwtAuthGuard)
  async completeSession(
    @CurrentUser() user: JwtUser | null,
    @Param('sessionId') sessionId: string,
  ) {
    const userId = user ? user.id : null;
    return this.coffeeMatchService.completeSession(userId, sessionId);
  }
}
