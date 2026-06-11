import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, cleanDatabase } from './helpers/test-app.helper.js';
import { seedTestData } from './helpers/seed-test-data.helper.js';
import { createTestUser, loginTestUser } from './helpers/auth.helper.js';

describe('PaymentsWebhook (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testData: any;
  let token: string;
  let orderNumber: string;

  beforeAll(async () => {
    const testEnv = await createTestApp();
    app = testEnv.app;
    prisma = testEnv.moduleRef.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    testData = await seedTestData(prisma);
    const user = await createTestUser(app, { email: 'webhook@example.com' });
    token = await loginTestUser(app, user.email);

    // Create an order for webhook tests
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: testData.product.id,
        variantId: testData.defaultVariant.id,
        quantity: 1,
      });
    const orderRes = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderType: 'pickup',
        paymentMethod: 'xendit',
        promoCode: testData.promotion.code,
      });
    orderNumber = orderRes.body.data.orderNumber;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/api/v1/payments/xendit/webhook (POST) - rejects invalid token', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/payments/xendit/webhook')
      .set('x-callback-token', 'wrong-token')
      .send({ external_id: orderNumber, status: 'PAID' })
      .expect(403);
  });

  it('/api/v1/payments/xendit/webhook (POST) - PAID updates order, cart, promo, and loyalty', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/payments/xendit/webhook')
      .set('x-callback-token', process.env.XENDIT_WEBHOOK_TOKEN!)
      .send({ external_id: orderNumber, status: 'PAID' })
      .expect(200);

    // 1. Order status
    const order = await prisma.order.findUnique({ where: { orderNumber } });
    expect(order?.paymentStatus).toBe('paid');
    expect(order?.status).toBe('confirmed');

    // 2. Cart cleared
    const cartRes = await request(app.getHttpServer())
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`);
    expect(cartRes.body.data.items.length).toBe(0);

    // 3. Promo used
    const promo = await prisma.promotion.findUnique({
      where: { code: testData.promotion.code },
    });
    expect(promo?.currentUses).toBe(1);

    // 4. Loyalty stamp created
    const stamps = await prisma.loyaltyStamp.findMany({
      where: { orderId: order!.id },
    });
    expect(stamps.length).toBe(1);
    expect(stamps[0].action).toBe('earn');
  });

  it('/api/v1/payments/xendit/webhook (POST) - PAID is idempotent', async () => {
    // Send twice
    await request(app.getHttpServer())
      .post('/api/v1/payments/xendit/webhook')
      .set('x-callback-token', process.env.XENDIT_WEBHOOK_TOKEN!)
      .send({ external_id: orderNumber, status: 'PAID' });
    await request(app.getHttpServer())
      .post('/api/v1/payments/xendit/webhook')
      .set('x-callback-token', process.env.XENDIT_WEBHOOK_TOKEN!)
      .send({ external_id: orderNumber, status: 'PAID' });

    // Promo used should still be 1
    const promo = await prisma.promotion.findUnique({
      where: { code: testData.promotion.code },
    });
    expect(promo?.currentUses).toBe(1);

    // Stamps should still be 1
    const order = await prisma.order.findUnique({ where: { orderNumber } });
    const stamps = await prisma.loyaltyStamp.findMany({
      where: { orderId: order!.id },
    });
    expect(stamps.length).toBe(1);
  });

  it('/api/v1/payments/xendit/webhook (POST) - EXPIRED updates order to cancelled', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/payments/xendit/webhook')
      .set('x-callback-token', process.env.XENDIT_WEBHOOK_TOKEN!)
      .send({ external_id: orderNumber, status: 'EXPIRED' })
      .expect(200);

    const order = await prisma.order.findUnique({ where: { orderNumber } });
    expect(order?.paymentStatus).toBe('expired');
    expect(order?.status).toBe('cancelled');
  });
});
