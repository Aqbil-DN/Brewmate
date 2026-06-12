import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, cleanDatabase } from './helpers/test-app.helper.js';
import { seedTestData } from './helpers/seed-test-data.helper.js';
import { createTestUser, loginTestUser } from './helpers/auth.helper.js';

describe('LoyaltyModule (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testData: any;
  let token1: string;
  let token2: string;

  beforeAll(async () => {
    const testEnv = await createTestApp();
    app = testEnv.app;
    prisma = testEnv.moduleRef.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    testData = await seedTestData(prisma);
    const user1 = await createTestUser(app, { email: 'loyalty1@example.com' });
    token1 = await loginTestUser(app, user1.email);

    const user2 = await createTestUser(app, { email: 'loyalty2@example.com' });
    token2 = await loginTestUser(app, user2.email);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/api/v1/loyalty/me (GET) - returns zero balance if no stamps', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/loyalty/me')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(res.body.data.stampsBalance).toBe(0);
  });

  it('/api/v1/loyalty/me (GET) - returns updated balance after paid webhook', async () => {
    // 1. Create order
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        productId: testData.product.id,
        variantId: testData.defaultVariant.id,
        quantity: 1,
      });
    const orderRes = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token1}`)
      .send({ orderType: 'pickup', paymentMethod: 'xendit' });
    const orderNumber = orderRes.body.data.orderNumber;

    // 2. Pay order
    await request(app.getHttpServer())
      .post('/api/v1/payments/xendit/webhook')
      .set('x-callback-token', process.env.XENDIT_WEBHOOK_TOKEN!)
      .send({ external_id: orderNumber, status: 'PAID' });

    // 3. Check balance
    const res = await request(app.getHttpServer())
      .get('/api/v1/loyalty/me')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(res.body.data.stampsBalance).toBe(1);

    // 4. Check user2 balance remains 0
    const res2 = await request(app.getHttpServer())
      .get('/api/v1/loyalty/me')
      .set('Authorization', `Bearer ${token2}`)
      .expect(200);

    expect(res2.body.data.stampsBalance).toBe(0);
  });

  it('/api/v1/loyalty/history (GET) - returns stamp records', async () => {
    await request(app.getHttpServer()).post('/api/v1/cart/items').set('Authorization', `Bearer ${token1}`).send({ productId: testData.product.id, variantId: testData.defaultVariant.id, quantity: 1 });
    const orderRes = await request(app.getHttpServer()).post('/api/v1/orders').set('Authorization', `Bearer ${token1}`).send({ orderType: 'pickup', paymentMethod: 'xendit' });
    await request(app.getHttpServer()).post('/api/v1/payments/xendit/webhook').set('x-callback-token', process.env.XENDIT_WEBHOOK_TOKEN!).send({ external_id: orderRes.body.data.orderNumber, status: 'PAID' });

    const res = await request(app.getHttpServer())
      .get('/api/v1/loyalty/history')
      .set('Authorization', `Bearer ${token1}`)
      .expect(200);

    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].stampsEarned).toBeGreaterThan(0);
  });
});
