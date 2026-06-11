import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, cleanDatabase } from './helpers/test-app.helper.js';
import { seedTestData } from './helpers/seed-test-data.helper.js';

describe('ProductsModule (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testData: any;

  beforeAll(async () => {
    const testEnv = await createTestApp();
    app = testEnv.app;
    prisma = testEnv.moduleRef.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    testData = await seedTestData(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/api/v1/categories (GET) - returns seeded categories', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/categories')
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].slug).toBe('coffee');
  });

  it('/api/v1/products (GET) - returns paginated products', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products')
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.meta.totalItems).toBeGreaterThan(0);
    // Security check
    expect(res.body.data.items[0].costPrice).toBeUndefined();
    expect(res.body.data.items[0].productAiAttributes).toBeUndefined();
  });

  it('/api/v1/products (GET) - filters by category', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products?categorySlug=coffee')
      .expect(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data.items[0].category.slug).toBe('coffee');
  });

  it('/api/v1/products (GET) - searches products', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/products?search=latte')
      .expect(200);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data.items[0].name.toLowerCase()).toContain('latte');
  });

  it('/api/v1/products/:id (GET) - returns detail without exposing secrets', async () => {
    const productId = testData.product.id;
    const res = await request(app.getHttpServer())
      .get(`/api/v1/products/${productId}`)
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(productId);
    expect(res.body.data.costPrice).toBeUndefined();
    expect(res.body.data.productAiAttributes).toBeUndefined();
  });

  it('/api/v1/products/invalid-id (GET) - returns validation error', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/products/invalid-uuid')
      .expect(400);
  });
});
