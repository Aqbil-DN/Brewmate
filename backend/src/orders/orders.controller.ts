import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(
    @CurrentUser('userId') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(userId, createOrderDto);
  }

  @Get()
  async getUserOrders(
    @CurrentUser('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 20;
    
    // Hard cap limit to 50
    const finalLimit = Math.min(limitNumber, 50);

    return this.ordersService.getUserOrders(
      userId,
      pageNumber,
      finalLimit,
      status,
      paymentStatus,
    );
  }

  @Get(':id')
  async getOrderDetail(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.getOrderDetail(userId, id);
  }

  @Post(':id/reorder')
  async reorder(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.reorder(userId, id);
  }
}
