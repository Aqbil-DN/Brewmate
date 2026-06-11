import { Controller, Post, Body, ForbiddenException, HttpCode, HttpStatus, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { XenditService } from './xendit.service.js';
import { XenditWebhookService } from './xendit-webhook.service.js';
import { CreateTestPaymentDto } from './dto/create-test-payment.dto.js';
import { XenditWebhookDto } from './dto/xendit-webhook.dto.js';
import { randomUUID } from 'crypto';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly xenditService: XenditService,
    private readonly xenditWebhookService: XenditWebhookService,
    private readonly configService: ConfigService,
  ) {}

  @Post('xendit/webhook')
  async handleXenditWebhook(
    @Headers('x-callback-token') callbackToken: string,
    @Body() payload: XenditWebhookDto,
  ) {
    const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;

    if (!expectedToken || callbackToken !== expectedToken) {
      this.logger.warn('Unauthorized webhook request: invalid token');
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'WEBHOOK_UNAUTHORIZED',
          message: 'Invalid webhook token.',
        },
      });
    }

    return this.xenditWebhookService.processWebhook(payload);
  }

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
