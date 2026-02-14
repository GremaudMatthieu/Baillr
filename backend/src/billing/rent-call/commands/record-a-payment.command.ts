export class RecordAPaymentCommand {
  constructor(
    public readonly rentCallId: string,
    public readonly entityId: string,
    public readonly userId: string,
    public readonly transactionId: string,
    public readonly bankStatementId: string | null,
    public readonly amountCents: number,
    public readonly payerName: string,
    public readonly paymentDate: string,
    public readonly paymentMethod: string = 'bank_transfer',
    public readonly paymentReference: string | null = null,
  ) {}
}
