import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, cleanDatabase } from './helpers/test-app.helper.js';

describe('AuthModule (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const testEnv = await createTestApp();
    app = testEnv.app;
    prisma = testEnv.moduleRef.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  const testUser = {
    email: 'auth_test@example.com',
    password: 'Password123!',
    fullName: 'Auth Test User',
    phoneNumber: '+62800000001',
  };

  it('/api/v1/auth/register (POST) - successfully registers a user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.accessToken).toBeDefined();

    // Verify DB
    const userInDb = await prisma.user.findUnique({
      where: { email: testUser.email },
    });
    expect(userInDb).toBeDefined();

    const prefs = await prisma.userPreference.findUnique({
      where: { userId: userInDb!.id },
    });
    expect(prefs).toBeDefined();

    const cart = await prisma.cart.findUnique({
      where: { userId: userInDb!.id },
    });
    expect(cart).toBeDefined();
  });

  it('/api/v1/auth/login (POST) - logs in successfully', async () => {
    // Register first
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser);

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('/api/v1/auth/login (POST) - rejects wrong password', async () => {
    // Register first
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword123!' })
      .expect(401);
  });

  it('/api/v1/auth/me (GET) - returns current user with token', async () => {
    // Register first
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser);
    const token = registerRes.body.data.accessToken;

    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testUser.email);
    expect(res.body.data.password).toBeUndefined(); // ensure password is not leaked
  });

  it('/api/v1/auth/me (GET) - rejects missing token', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });
});
