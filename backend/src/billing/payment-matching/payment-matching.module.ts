import { Module } from '@nestjs/common';
import { PaymentMatchingService } from './domain/service/payment-matching.service.js';

@Module({
  providers: [PaymentMatchingService],
  exports: [PaymentMatchingService],
})
export class PaymentMatchingModule {}
