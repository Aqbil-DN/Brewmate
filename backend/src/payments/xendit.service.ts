import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { CreateXenditPaymentInput, CreateXenditPaymentResult } from './payment.types.js';
import { AppErrorCodes } from '../common/errors/app-error-codes.js';

@Injectable()
export class XenditService {
  private readonly logger = new Logger(XenditService.name);
  private readonly axiosClient: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('XENDIT_BASE_URL', 'https://api.xendit.co');
    
    this.axiosClient = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.buildBasicAuthHeader(),
      },
    });
  }

  private buildBasicAuthHeader(): string {
    const secretKey = this.configService.get<string>('XENDIT_SECRET_KEY');
    if (!secretKey) {
      this.logger.error('XENDIT_SECRET_KEY is missing from environment variables.');
      throw new InternalServerErrorException('Payment gateway misconfigured.');
    }
    // Xendit Basic Auth uses secret_key + ":"
    const base64Credentials = Buffer.from(`${secretKey}:`).toString('base64');
    return `Basic ${base64Credentials}`;
  }

  private normalizeAmountToIntegerRupiah(amount: number): number {
    return Math.round(amount);
  }

  private mapXenditResponseToPaymentResult(response: any): CreateXenditPaymentResult {
    return {
      provider: 'xendit',
      externalId: response.external_id,
      paymentReference: response.id,
      paymentUrl: response.invoice_url,
      expiresAt: response.expiry_date || null,
      // Store raw response safely (excluding keys if any)
      rawResponse: {
        status: response.status,
        merchant_name: response.merchant_name,
        amount: response.amount,
      },
    };
  }

  async createPaymentLinkForOrder(
    input: CreateXenditPaymentInput,
  ): Promise<CreateXenditPaymentResult> {
    try {
      this.logger.log(`Creating Xendit invoice for order: ${input.orderNumber}, Amount: ${input.amount}`);

      const successRedirectUrl = this.configService.get<string>('XENDIT_SUCCESS_REDIRECT_URL');
      const failureRedirectUrl = this.configService.get<string>('XENDIT_FAILURE_REDIRECT_URL');

      const payload = {
        external_id: input.orderNumber, // Using orderNumber as the external ID
        amount: this.normalizeAmountToIntegerRupiah(input.amount),
        payer_email: input.customerEmail,
        description: input.description,
        success_redirect_url: successRedirectUrl,
        failure_redirect_url: failureRedirectUrl,
        customer: {
          given_names: input.customerName,
          email: input.customerEmail,
          ...(input.customerPhone && { mobile_number: input.customerPhone }),
        },
        items: input.items?.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: this.normalizeAmountToIntegerRupiah(item.price),
        })),
        ...(input.paymentMethods && { payment_methods: input.paymentMethods }),
      };

      // Xendit V2 Invoice API endpoint
      const response = await this.axiosClient.post('/v2/invoices', payload);

      this.logger.log(`Successfully created Xendit invoice for order: ${input.orderNumber}. Ref: ${response.data.id}`);

      return this.mapXenditResponseToPaymentResult(response.data);
    } catch (error: any) {
      this.logger.error(`Failed to create Xendit invoice for order: ${input.orderNumber}`);
      
      if (error.response) {
        // Safe logging without exposing secret keys from headers
        this.logger.error(`Xendit API Error: Status ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      } else {
        this.logger.error(`Xendit Request Error: ${error.message}`);
      }

      throw new InternalServerErrorException({
        code: AppErrorCodes.PAYMENT_GATEWAY_ERROR,
        message: 'Unable to create payment. Please try again.',
      });
    }
  }
}
