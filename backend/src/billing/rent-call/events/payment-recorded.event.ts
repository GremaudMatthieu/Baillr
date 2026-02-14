import { Event } from 'nestjs-cqrx';

export interface PaymentRecordedData {
  rentCallId: string;
  entityId: string;
  userId: string;
  transactionId: string;
  bankStatementId: string | null;
  amountCents: number;
  payerName: string;
  paymentDate: string;
  recordedAt: string;
  paymentMethod?: string;
  paymentReference?: string | null;
}

export class PaymentRecorded extends Event<PaymentRecordedData> {
  constructor(data: PaymentRecordedData) {
    super(data);
  }
}
