import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { XenditService } from '../../src/payments/xendit.service.js';
import { GroqService } from '../../src/ai/groq.service.js';
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
  // Safe generic way to truncate all public tables in PostgreSQL
  // Exclude Prisma migrations table
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename != '_prisma_migrations';`;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${tablename}" CASCADE;`,
        );
      } catch (error) {
        console.error(`Error truncating ${tablename}:`, error);
      }
    }
  }
}
