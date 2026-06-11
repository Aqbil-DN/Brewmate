import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { XenditService } from './xendit.service.js';
import { PaymentsController } from './payments.controller.js';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentsController],
  providers: [XenditService],
  exports: [XenditService],
})
export class PaymentsModule {}
