import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GroqService } from './groq.service.js';
import { AiController } from './ai.controller.js';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [GroqService],
  exports: [GroqService],
})
export class AiModule {}

