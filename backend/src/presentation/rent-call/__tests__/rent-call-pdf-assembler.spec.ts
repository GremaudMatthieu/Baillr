import { RentCallPdfAssembler } from '../services/rent-call-pdf-assembler.service';

function makeRentCall(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rc-1',
    entityId: 'entity-1',
    userId: 'user_123',
    leaseId: 'lease-1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    month: '2026-02',
    rentAmountCents: 75000,
    billingLines: [
      { chargeCategoryId: 'cat-1', categoryLabel: 'Provisions sur charges', amountCents: 10000 },
    ],
    totalAmountCents: 85000,
    isProRata: false,
    occupiedDays: null,
    totalDaysInMonth: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeIndividualTenant() {
  return {
    id: 'tenant-1',
    entityId: 'entity-1',
    userId: 'user_123',
    type: 'individual',
    firstName: 'Jean',
    lastName: 'DUPONT',
    companyName: null,
    siret: null,
    email: 'jean@example.com',
    phoneNumber: null,
    addressStreet: '5 avenue Victor Hugo',
    addressPostalCode: '69003',
    addressCity: 'LYON',
    addressComplement: null,
    insuranceProvider: null,
    policyNumber: null,
    renewalDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeCompanyTenant() {
  return {
    ...makeIndividualTenant(),
    type: 'company',
    companyName: 'ACME Corp',
    siret: '98765432109876',
  };
}

function makeUnit() {
  return {
    id: 'unit-1',
    propertyId: 'prop-1',
    userId: 'user_123',
    identifier: 'Apt 101',
    type: 'apartment',
    floor: 1,
    surfaceArea: 50,
    billableOptions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeLease() {
  return {
    id: 'lease-1',
    entityId: 'entity-1',
    userId: 'user_123',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    startDate: new Date('2025-01-01'),
    rentAmountCents: 75000,
    securityDepositCents: 75000,
    monthlyDueDate: 5,
    revisionIndexType: 'IRL',
    billingLines: [],
    revisionDay: null,
    revisionMonth: null,
    referenceQuarter: null,
    referenceYear: null,
    baseIndexValue: null,
    endDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeEntity() {
  return {
    id: 'entity-1',
    userId: 'user_123',
    type: 'sci',
    name: 'SCI EXAMPLE',
    siret: '12345678901234',
    addressStreet: '12 rue de la Paix',
    addressPostalCode: '75002',
    addressCity: 'PARIS',
    addressCountry: 'France',
    addressComplement: null,
    legalInformation: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeBankAccounts() {
  return [
    {
      id: 'ba-1',
      entityId: 'entity-1',
      type: 'bank_account',
      label: 'BNP',
      iban: 'FR76 1234 5678 9012 3456 7890 123',
      bic: 'BNPAFRPP',
      bankName: 'BNP Paribas',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

describe('RentCallPdfAssembler', () => {
  let assembler: RentCallPdfAssembler;

  beforeEach(() => {
    assembler = new RentCallPdfAssembler();
  });

  it('should assemble PDF data for individual tenant', () => {
    const result = assembler.assembleFromRentCall(
      makeRentCall() as any,
      makeIndividualTenant() as any,
      makeUnit() as any,
      makeLease() as any,
      makeEntity() as any,
      makeBankAccounts() as any,
    );

    expect(result.tenantName).toBe('Jean DUPONT');
    expect(result.entityName).toBe('SCI EXAMPLE');
    expect(result.unitIdentifier).toBe('Apt 101');
    expect(result.leaseReference).toBe('01/01/2025');
    expect(result.billingPeriod).toBe('Février 2026');
    expect(result.dueDate).toBe(5);
    expect(result.iban).toBe('FR76 1234 5678 9012 3456 7890 123');
    expect(result.bic).toBe('BNPAFRPP');
    expect(result.rentAmountCents).toBe(75000);
    expect(result.totalAmountCents).toBe(85000);
  });

  it('should assemble PDF data for company tenant', () => {
    const result = assembler.assembleFromRentCall(
      makeRentCall() as any,
      makeCompanyTenant() as any,
      makeUnit() as any,
      makeLease() as any,
      makeEntity() as any,
      makeBankAccounts() as any,
    );

    expect(result.tenantName).toBe('ACME Corp');
  });

  it('should handle entity without bank accounts', () => {
    const result = assembler.assembleFromRentCall(
      makeRentCall() as any,
      makeIndividualTenant() as any,
      makeUnit() as any,
      makeLease() as any,
      makeEntity() as any,
      [],
    );

    expect(result.iban).toBeNull();
    expect(result.bic).toBeNull();
  });

  it('should assemble pro-rata data correctly', () => {
    const result = assembler.assembleFromRentCall(
      makeRentCall({ isProRata: true, occupiedDays: 15, totalDaysInMonth: 28 }) as any,
      makeIndividualTenant() as any,
      makeUnit() as any,
      makeLease() as any,
      makeEntity() as any,
      makeBankAccounts() as any,
    );

    expect(result.isProRata).toBe(true);
    expect(result.occupiedDays).toBe(15);
    expect(result.totalDaysInMonth).toBe(28);
  });
});
