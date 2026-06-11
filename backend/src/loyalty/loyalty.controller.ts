import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

interface JwtUser {
  id: string;
  email: string;
  authProvider: string;
}

@Controller('loyalty')
@UseGuards(JwtAuthGuard)
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('me')
  async getLoyaltySummary(@CurrentUser() user: JwtUser) {
    return this.loyaltyService.getLoyaltySummary(user.id);
  }

  @Get('history')
  async getLoyaltyHistory(
    @CurrentUser() user: JwtUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    let limitNumber = limit ? parseInt(limit, 10) : 20;
    limitNumber = Math.min(limitNumber, 50); // Hard cap limit

    return this.loyaltyService.getLoyaltyHistory(user.id, pageNumber, limitNumber);
  }
}
