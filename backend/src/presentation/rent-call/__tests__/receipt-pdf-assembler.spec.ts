import { ReceiptPdfAssembler } from '../services/receipt-pdf-assembler.service';
import type { ReceiptRentCallData, ReceiptPaymentData } from '../services/receipt-pdf-assembler.service';

function makeRentCall(overrides: Partial<ReceiptRentCallData> = {}): ReceiptRentCallData {
  return {
    month: '2026-02',
    rentAmountCents: 75000,
    billingLines: [
      { label: 'Provisions sur charges', amountCents: 10000, type: 'provision' },
    ],
    totalAmountCents: 85000,
    isProRata: false,
    occupiedDays: null,
    totalDaysInMonth: null,
    paymentStatus: 'paid',
    remainingBalanceCents: 0,
    ...overrides,
  };
}

function makeIndividualTenant() {
  return {
    type: 'individual',
    firstName: 'Jean',
    lastName: 'DUPONT',
    companyName: null,
    email: 'jean@example.com',
    addressStreet: '5 avenue Victor Hugo',
    addressPostalCode: '69003',
    addressCity: 'LYON',
    addressComplement: null,
  };
}

function makeCompanyTenant() {
  return {
    ...makeIndividualTenant(),
    type: 'company',
    companyName: 'ACME Corp',
  };
}

function makeUnit() {
  return { identifier: 'Apt 101' };
}

function makeLease() {
  return {
    startDate: new Date('2025-01-01'),
    monthlyDueDate: 5,
  };
}

function makeEntity() {
  return {
    name: 'SCI EXAMPLE',
    email: 'contact@sci-example.com',
    siret: '12345678901234',
    addressStreet: '12 rue de la Paix',
    addressPostalCode: '75002',
    addressCity: 'PARIS',
    addressComplement: null,
  };
}

function makeBankAccounts() {
  return [
    {
      type: 'bank_account',
      isDefault: true,
      iban: 'FR76 1234 5678 9012 3456 7890 123',
      bic: 'BNPAFRPP',
    },
  ];
}

function makePayments(overrides: Partial<ReceiptPaymentData>[] = []): ReceiptPaymentData[] {
  if (overrides.length > 0) {
    return overrides.map((o) => ({
      amountCents: 85000,
      paymentDate: new Date('2026-02-10'),
      paymentMethod: 'bank_transfer',
      ...o,
    }));
  }
  return [
    {
      amountCents: 85000,
      paymentDate: new Date('2026-02-10'),
      paymentMethod: 'bank_transfer',
    },
  ];
}

describe('ReceiptPdfAssembler', () => {
  let assembler: ReceiptPdfAssembler;

  beforeEach(() => {
    assembler = new ReceiptPdfAssembler();
  });

  it('should set receiptType to quittance for fully paid rent call', () => {
    const result = assembler.assembleFromRentCall(
      makeRentCall({ paymentStatus: 'paid' }),
      makeIndividualTenant(),
      makeUnit(),
      makeLease(),
      makeEntity(),
      makeBankAccounts(),
      makePayments(),
    );

    expect(result.receiptType).toBe('quittance');
  });

  it('should set receiptType to quittance for overpaid rent call', () => {
    const result = assembler.assembleFromRentCall(
      makeRentCall({ paymentStatus: 'overpaid' }),
      makeIndividualTenant(),
      makeUnit(),
      makeLease(),
      makeEntity(),
      makeBankAccounts(),
      makePayments(),
    );

    expect(result.receiptType).toBe('quittance');
  });

  it('should set receiptType to recu_paiement for partially paid rent call', () => {
    const result = assembler.assembleFromRentCall(
      makeRentCall({ paymentStatus: 'partial', remainingBalanceCents: 35000 }),
      makeIndividualTenant(),
      makeUnit(),
      makeLease(),
      makeEntity(),
      makeBankAccounts(),
      makePayments([{ amountCents: 50000 }]),
    );

    expect(result.receiptType).toBe('recu_paiement');
    expect(result.totalPaidCents).toBe(50000);
    expect(result.remainingBalanceCents).toBe(35000);
  });

  it('should compute totalPaidCents from payments array', () => {
    const result = assembler.assembleFromRentCall(
      makeRentCall({ paymentStatus: 'paid' }),
      makeIndividualTenant(),
      makeUnit(),
      makeLease(),
      makeEntity(),
      makeBankAccounts(),
      makePayments([
        { amountCents: 50000, paymentDate: new Date('2026-02-05') },
        { amountCents: 35000, paymentDate: new Date('2026-02-10') },
      ]),
    );

    expect(result.totalPaidCents).toBe(85000);
    expect(result.payments).toHaveLength(2);
  });

  it('should use last payment date as paymentDate', () => {
    const result = assembler.assembleFromRentCall(
      makeRentCall({ paymentStatus: 'paid' }),
      makeIndividualTenant(),
      makeUnit(),
      makeLease(),
      makeEntity(),
      makeBankAccounts(),
      makePayments([
        { amountCents: 50000, paymentDate: new Date('2026-02-05') },
        { amountCents: 35000, paymentDate: new Date('2026-02-10') },
      ]),
    );

    expect(result.paymentDate).toBe('10/02/2026');
  });

  it('should format company tenant name correctly', () => {
    const result = assembler.assembleFromRentCall(
      makeRentCall(),
      makeCompanyTenant(),
      makeUnit(),
      makeLease(),
      makeEntity(),
      makeBankAccounts(),
      makePayments(),
    );

    expect(result.tenantName).toBe('ACME Corp');
  });

  it('should format individual tenant name correctly', () => {
    const result = assembler.assembleFromRentCall(
      makeRentCall(),
      makeIndividualTenant(),
      makeUnit(),
      makeLease(),
      makeEntity(),
      makeBankAccounts(),
      makePayments(),
    );

    expect(result.tenantName).toBe('Jean DUPONT');
  });

  it('should handle pro-rata data', () => {
    const result = assembler.assembleFromRentCall(
      makeRentCall({ isProRata: true, occupiedDays: 15, totalDaysInMonth: 28 }),
      makeIndividualTenant(),
      makeUnit(),
      makeLease(),
      makeEntity(),
      makeBankAccounts(),
      makePayments(),
    );

    expect(result.isProRata).toBe(true);
    expect(result.occupiedDays).toBe(15);
    expect(result.totalDaysInMonth).toBe(28);
  });

  it('should format payment methods in French', () => {
    const result = assembler.assembleFromRentCall(
      makeRentCall({ paymentStatus: 'paid' }),
      makeIndividualTenant(),
      makeUnit(),
      makeLease(),
      makeEntity(),
      makeBankAccounts(),
      makePayments([
        { amountCents: 85000, paymentDate: new Date('2026-02-10'), paymentMethod: 'bank_transfer' },
      ]),
    );

    expect(result.payments[0].method).toBe('Virement bancaire');
  });

  it('should handle entity without bank accounts', () => {
    const result = assembler.assembleFromRentCall(
      makeRentCall(),
      makeIndividualTenant(),
      makeUnit(),
      makeLease(),
      makeEntity(),
      [],
      makePayments(),
    );

    expect(result.iban).toBeNull();
    expect(result.bic).toBeNull();
  });

  it('should sort payments by date ascending', () => {
    const result = assembler.assembleFromRentCall(
      makeRentCall({ paymentStatus: 'paid' }),
      makeIndividualTenant(),
      makeUnit(),
      makeLease(),
      makeEntity(),
      makeBankAccounts(),
      [
        { amountCents: 35000, paymentDate: new Date('2026-02-10'), paymentMethod: 'check' },
        { amountCents: 50000, paymentDate: new Date('2026-02-05'), paymentMethod: 'cash' },
      ],
    );

    expect(result.payments[0].date).toBe('05/02/2026');
    expect(result.payments[1].date).toBe('10/02/2026');
  });
});
