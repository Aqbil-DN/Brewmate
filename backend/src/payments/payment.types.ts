export interface CreateXenditPaymentInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  description: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  paymentMethods?: string[];
}

export interface CreateXenditPaymentResult {
  provider: 'xendit';
  externalId: string;
  paymentReference: string;
  paymentUrl: string;
  expiresAt?: string | null;
  rawResponse?: unknown;
}
