import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GroqService } from './groq.service.js';

@Module({
  imports: [ConfigModule],
  providers: [GroqService],
  exports: [GroqService],
})
export class AiModule {}
