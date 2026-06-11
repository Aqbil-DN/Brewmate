import { Controller, Post, Body, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XenditService } from './xendit.service.js';
import { CreateTestPaymentDto } from './dto/create-test-payment.dto.js';
import { randomUUID } from 'crypto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly xenditService: XenditService,
    private readonly configService: ConfigService,
  ) {}

  @Post('dev/create-test-link')
  @HttpCode(HttpStatus.OK)
  async createTestLink(@Body() dto: CreateTestPaymentDto) {
    const env = this.configService.get<string>('NODE_ENV', 'development');
    if (env === 'production') {
      throw new ForbiddenException('This endpoint is only available in development mode.');
    }

    const orderNumber = `BRW-TEST-${Date.now()}`;
    const result = await this.xenditService.createPaymentLinkForOrder({
      orderId: randomUUID(),
      orderNumber,
      amount: dto.amount,
      customerName: 'Test Customer',
      customerEmail: dto.email,
      description: `Test Payment for ${orderNumber}`,
      items: [
        {
          name: 'Test Item',
          quantity: 1,
          price: dto.amount,
        },
      ],
    });

    // Remove rawResponse so we don't dump too much unnecessary payload to the client
    const { rawResponse, ...safeResult } = result;

    return safeResult;
  }
}
