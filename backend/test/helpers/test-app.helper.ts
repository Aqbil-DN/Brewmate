import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { XenditService } from '../../src/payments/xendit.service.js';
import { GroqService } from '../../src/ai/groq.service.js';
import { FirebaseAdminService } from '../../src/auth/firebase-admin.service.js';
import { GlobalHttpExceptionFilter } from '../../src/common/filters/http-exception.filter.js';
import { ResponseInterceptor } from '../../src/common/interceptors/response.interceptor.js';

export const mockXenditService = {
  createPaymentLinkForOrder: jest
    .fn()
    .mockImplementation(async (input: any) => ({
      provider: 'xendit',
      externalId: input.orderNumber,
      paymentReference: 'xendit-test-' + input.orderNumber,
      paymentUrl: 'https://checkout.xendit.co/test/' + input.orderNumber,
      expiresAt: null,
    })),
};

export const mockGroqService = {
  generateBaristaReply: jest.fn().mockImplementation(async () => ({
    content: 'Aku rekomendasikan menu terbaik berdasarkan preferensimu.',
    provider: 'groq',
    model: 'test-model',
    fallbackUsed: false,
  })),
};

export const mockFirebaseAdminService = {
  onModuleInit: jest.fn(),
  verifyIdToken: jest.fn().mockRejectedValue(new Error('Firebase not used in tests')),
};

export async function createTestApp(): Promise<{
  app: INestApplication;
  moduleRef: TestingModule;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(XenditService)
    .useValue(mockXenditService)
    .overrideProvider(GroqService)
    .useValue(mockGroqService)
    .overrideProvider(FirebaseAdminService)
    .useValue(mockFirebaseAdminService)
    .compile();

  const app = moduleRef.createNestApplication();

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.init();

  return { app, moduleRef };
}

export async function cleanDatabase(prisma: PrismaService) {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('cleanDatabase can only be run in test environment');
  }

  // Clean child tables first to avoid foreign key constraint errors
  const tables = [
    'ai_recommendation_events',
    'ai_quiz_sessions',
    'loyalty_stamps',
    'order_items',
    'orders',
    'cart_items',
    'carts',
    'product_tags',
    'product_ai_attributes',
    'product_variants',
    'products',
    'tags',
    'categories',
    'user_preferences',
    'addresses',
    'users'
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
    } catch (error) {
      console.error(`Error cleaning table ${table}:`, error);
    }
  }
}
