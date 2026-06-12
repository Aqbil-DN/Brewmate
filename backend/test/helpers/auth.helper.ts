import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function createTestUser(
  app: INestApplication,
  userDetails: any = {},
) {
  const email = userDetails.email || `test_${Date.now()}@example.com`;
  const password = userDetails.password || 'Password123!';
  const uniquePhone = '+628' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');

  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({
      email,
      password,
      fullName: userDetails.fullName || 'Test User',
      phoneNumber: userDetails.phoneNumber || uniquePhone,
    });

  return { email, password, response: response.body };
}

export async function loginTestUser(
  app: INestApplication,
  email: string,
  password: string = 'Password123!',
) {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password });

  return response.body.data.accessToken;
}
