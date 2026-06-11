import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, cleanDatabase } from './helpers/test-app.helper.js';
import { seedTestData } from './helpers/seed-test-data.helper.js';

describe('PromotionsModule (e2e)', () => {
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

  it('/api/v1/promotions/validate (POST) - validates BREW10 successfully', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/promotions/validate')
      .send({ code: testData.promotion.code, cartSubtotal: 100000 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(true);
    expect(res.body.data.discountAmount).toBe(10000); // 10% of 100k
  });

  it('/api/v1/promotions/validate (POST) - rejects min order not met', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/promotions/validate')
      .send({ code: testData.promotion.code, cartSubtotal: 20000 }) // Min is 50000
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('/api/v1/promotions/validate (POST) - rejects invalid code', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/promotions/validate')
      .send({ code: 'INVALID', cartSubtotal: 100000 })
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  it('/api/v1/promotions/validate (POST) - caps max discount amount', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/promotions/validate')
      .send({ code: testData.promotion.code, cartSubtotal: 1000000 }) // 10% of 1M = 100k, but max is 20k
      .expect(200);

    expect(res.body.data.discountAmount).toBe(20000);
  });

  it('/api/v1/promotions/validate (POST) - does not increment currentUses during validation', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/promotions/validate')
      .send({ code: testData.promotion.code, cartSubtotal: 100000 });

    const promo = await prisma.promotion.findUnique({
      where: { code: testData.promotion.code },
    });
    expect(promo?.currentUses).toBe(0);
  });
});
