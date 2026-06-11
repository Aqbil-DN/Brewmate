import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import {
  createTestApp,
  cleanDatabase,
  mockGroqService,
} from './helpers/test-app.helper.js';
import { seedTestData } from './helpers/seed-test-data.helper.js';
import { createTestUser, loginTestUser } from './helpers/auth.helper.js';

describe('CoffeeMatchModule (e2e)', () => {
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
    const user = await createTestUser(app, {
      email: 'coffeematch@example.com',
    });
    token = await loginTestUser(app, user.email);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('/api/v1/coffee-match/quiz (POST) - guest user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/coffee-match/quiz')
      .send({
        needAnswer: 'stay_awake',
        flavorAnswer: 'creamy',
        drinkTypeAnswer: 'coffee',
        budgetAnswer: 'regular',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.recommendations.length).toBeGreaterThan(0);
    // Should use the seeded real product
    expect(res.body.data.recommendations[0].productId).toBe(
      testData.product.id,
    );
  });

  it('/api/v1/coffee-match/quiz (POST) - authenticated user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/coffee-match/quiz')
      .set('Authorization', `Bearer ${token}`)
      .send({
        needAnswer: 'stay_awake',
        flavorAnswer: 'creamy',
        drinkTypeAnswer: 'coffee',
        budgetAnswer: 'regular',
      })
      .expect(201);

    expect(res.body.success).toBe(true);

    // Check DB for recommendation events linked to user
    const user = await prisma.user.findUnique({
      where: { email: 'coffeematch@example.com' },
    });
    const events = await prisma.aiRecommendationEvent.findMany({
      where: { userId: user!.id },
    });
    expect(events.length).toBeGreaterThan(0);
  });

  it('/api/v1/coffee-match/recommendations/:eventId/add-to-cart (POST) - requires JWT and updates analytics', async () => {
    // 1. Submit quiz to get eventId
    const quizRes = await request(app.getHttpServer())
      .post('/api/v1/coffee-match/quiz')
      .set('Authorization', `Bearer ${token}`)
      .send({
        needAnswer: 'stay_awake',
        flavorAnswer: 'creamy',
        drinkTypeAnswer: 'coffee',
        budgetAnswer: 'regular',
      });

    const eventId = quizRes.body.data.recommendations[0].eventId;

    // 2. Add to cart
    await request(app.getHttpServer())
      .post(`/api/v1/coffee-match/recommendations/${eventId}/add-to-cart`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 1 })
      .expect(201);

    // 3. Verify event was updated
    const event = await prisma.aiRecommendationEvent.findUnique({
      where: { id: eventId },
    });
    expect(event?.wasAddedToCart).toBe(true);

    // 4. Cart should have the item
    const cartRes = await request(app.getHttpServer())
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${token}`);
    expect(cartRes.body.data.items.length).toBe(1);
  });

  it('/api/v1/coffee-match/chat (POST) - returns mocked assistant message and recommendations', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/coffee-match/chat')
      .send({ message: 'Aku butuh kopi creamy untuk lembur' })
      .expect(201);

    expect(res.body.data.assistantMessage).toBe(
      'Aku rekomendasikan menu terbaik berdasarkan preferensimu.',
    );
    expect(res.body.data.recommendations.length).toBeGreaterThan(0);
    expect(mockGroqService.generateBaristaReply).toHaveBeenCalled();
  });

  it('/api/v1/coffee-match/chat (POST) - off-topic chat returns no recommendations', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/coffee-match/chat')
      .send({ message: 'Bantu aku kerjakan PR matematika' })
      .expect(201);

    // Off-topic returns a hardcoded reply and no recommendations
    expect(res.body.data.recommendations.length).toBe(0);
    expect(res.body.data.assistantMessage).toContain('Maaf, aku lebih ahli');
  });

  it('/api/v1/coffee-match/chat (POST) - enforces turn limit', async () => {
    // Attempt to play 7 turns in a single session
    let sessionId: string | undefined;

    for (let i = 0; i < 6; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/coffee-match/chat')
        .send({ sessionId, message: 'Kopi' });

      if (!sessionId) sessionId = res.body.data.sessionId;
    }

    // 7th turn should fail
    await request(app.getHttpServer())
      .post('/api/v1/coffee-match/chat')
      .send({ sessionId, message: 'Kopi lagi' })
      .expect(400);
  });
});
