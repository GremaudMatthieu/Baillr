import type { RentCallPdfData } from '../rent-call-pdf-data.interface';

export function makeTestPdfData(overrides: Partial<RentCallPdfData> = {}): RentCallPdfData {
  return {
    entityName: 'SCI EXAMPLE',
    entityAddress: '12 rue de la Paix, 75002 PARIS',
    entitySiret: '12345678901234',
    tenantName: 'Jean DUPONT',
    tenantAddress: '5 avenue Victor Hugo, 69003 LYON',
    unitIdentifier: 'Apt 101',
    leaseReference: '01/01/2025',
    billingPeriod: 'Février 2026',
    dueDate: 5,
    rentAmountCents: 75000,
    billingLines: [
      { categoryLabel: 'Provisions sur charges', amountCents: 10000 },
    ],
    totalAmountCents: 85000,
    isProRata: false,
    occupiedDays: null,
    totalDaysInMonth: null,
    iban: 'FR76 1234 5678 9012 3456 7890 123',
    bic: 'BNPAFRPP',
    ...overrides,
  };
}
