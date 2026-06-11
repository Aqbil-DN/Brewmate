import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, cleanDatabase } from './helpers/test-app.helper.js';
import { seedTestData } from './helpers/seed-test-data.helper.js';
import { createTestUser, loginTestUser } from './helpers/auth.helper.js';

describe('CartModule (e2e)', () => {
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
    const user = await createTestUser(app, { email: 'cart@example.com' });
    token = await loginTestUser(app, user.email);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/api/v1/cart (GET) - returns empty cart initially', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(0);
    expect(res.body.data.cartSubtotal).toBe(0);
  });

  it('/api/v1/cart/items (POST) - adds available product to cart', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: testData.product.id,
        variantId: testData.defaultVariant.id,
        quantity: 2,
      })
      .expect(201);

    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].quantity).toBe(2);
    // Base 30000 + Variant 0 = 30000 * 2 = 60000
    expect(res.body.data.items[0].lineSubtotal).toBe(60000);
    expect(res.body.data.cartSubtotal).toBe(60000);
    // Security check
    expect(res.body.data.items[0].costPrice).toBeUndefined();
  });

  it('/api/v1/cart/items (POST) - increments quantity on same product/variant', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: testData.product.id,
        variantId: testData.defaultVariant.id,
        quantity: 1,
      });

    const res = await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: testData.product.id,
        variantId: testData.defaultVariant.id,
        quantity: 2,
      })
      .expect(201);

    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0].quantity).toBe(3);
    expect(res.body.data.cartSubtotal).toBe(90000);
  });

  it('/api/v1/cart/items/:id (PATCH) - updates item quantity', async () => {
    const addRes = await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: testData.product.id,
        variantId: testData.defaultVariant.id,
        quantity: 1,
      });

    const itemId = addRes.body.data.items[0].id;

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/cart/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 5 })
      .expect(200);

    expect(res.body.data.items[0].quantity).toBe(5);
    expect(res.body.data.cartSubtotal).toBe(150000);
  });

  it('/api/v1/cart/items/:id (DELETE) - removes item from cart', async () => {
    const addRes = await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: testData.product.id,
        variantId: testData.defaultVariant.id,
        quantity: 1,
      });

    const itemId = addRes.body.data.items[0].id;

    const res = await request(app.getHttpServer())
      .delete(`/api/v1/cart/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.items.length).toBe(0);
    expect(res.body.data.cartSubtotal).toBe(0);
  });

  it('/api/v1/cart/clear (DELETE) - clears the entire cart', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: testData.product.id,
        variantId: testData.defaultVariant.id,
        quantity: 1,
      });

    const res = await request(app.getHttpServer())
      .delete('/api/v1/cart/clear')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.items.length).toBe(0);
  });
});
