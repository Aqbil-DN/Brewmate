import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import {
  createTestApp,
  cleanDatabase,
  mockXenditService,
} from './helpers/test-app.helper.js';
import { seedTestData } from './helpers/seed-test-data.helper.js';
import { createTestUser, loginTestUser } from './helpers/auth.helper.js';

describe('OrdersModule (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testData: any;
  let token: string;

  beforeAll(async () => {
    const testEnv = await createTestApp();
    app = testEnv.app;
    prisma = testEnv.moduleRef.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    testData = await seedTestData(prisma);
    const user = await createTestUser(app, { email: 'orders@example.com' });
    token = await loginTestUser(app, user.email);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/api/v1/orders (POST) - rejects empty cart', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderType: 'pickup', paymentMethod: 'xendit' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('/api/v1/orders (POST) - creates order from cart, calls Xendit', async () => {
    // 1. Add item to cart
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: testData.product.id,
        variantId: testData.defaultVariant.id,
        quantity: 2,
      });

    // 2. Create order
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderType: 'pickup',
        paymentMethod: 'xendit',
        promoCode: testData.promotion.code,
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.orderNumber).toBeDefined();
    expect(res.body.data.paymentUrl).toContain(
      'https://checkout.xendit.co/test/',
    );

    // Check mocked Xendit service was called
    expect(mockXenditService.createPaymentLinkForOrder).toHaveBeenCalled();

    // 3. Verify order in DB
    const orderInDb = await prisma.order.findUnique({
      where: { id: res.body.data.id },
      include: { orderItems: true },
    });
    expect(orderInDb).toBeDefined();
    expect(orderInDb?.orderItems.length).toBe(1);
    expect(orderInDb?.promoCode).toBe(testData.promotion.code);

    // 4. Cart should NOT be empty yet (wait for paid webhook)
    const cartRes = await request(app.getHttpServer())
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`);
    expect(cartRes.body.data.items.length).toBe(1);
  });

  it('/api/v1/orders (GET) - returns order history', async () => {
    // Add to cart and order
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: testData.product.id,
        variantId: testData.defaultVariant.id,
        quantity: 1,
      });
    await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderType: 'pickup', paymentMethod: 'xendit' });

    const res = await request(app.getHttpServer())
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.length).toBe(1);
  });

  it('/api/v1/orders/:id/reorder (POST) - adds available items back to cart', async () => {
    // Create an order
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
      .send({ orderType: 'pickup', paymentMethod: 'xendit' });
    const orderId = orderRes.body.data.id;

    // Clear cart
    await request(app.getHttpServer())
      .delete('/api/v1/cart/clear')
      .set('Authorization', `Bearer ${token}`);

    // Reorder
    const reorderRes = await request(app.getHttpServer())
      .post(`/api/v1/orders/${orderId}/reorder`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(reorderRes.body.data.items.length).toBe(1);
    expect(reorderRes.body.data.items[0].quantity).toBe(1);
  });
});
