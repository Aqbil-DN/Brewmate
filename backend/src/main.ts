import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  // ── Configuration ────────────────────────────────────────
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // ── Security ─────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ─────────────────────────────────────────────────
  app.enableCors({
    origin: true, // Allow all origins in development; restrict in production
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ── Global Prefix ────────────────────────────────────────
  const apiPrefix = configService.get<string>('API_PREFIX', '/api/v1');
  app.setGlobalPrefix(apiPrefix);


  // ── Global Pipes ─────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Global Filters ───────────────────────────────────────
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // ── Global Interceptors ──────────────────────────────────
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ── Start ────────────────────────────────────────────────
  await app.listen(port);

  logger.log(`🚀 BrewMate AI Backend running on http://localhost:${port}`);
  logger.log(`📡 API available at http://localhost:${port}/api/v1`);
  logger.log(`🌍 Environment: ${configService.get<string>('NODE_ENV', 'development')}`);
}

bootstrap();
