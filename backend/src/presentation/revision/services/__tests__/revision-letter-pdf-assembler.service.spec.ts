import { RevisionLetterPdfAssembler } from '../revision-letter-pdf-assembler.service';

describe('RevisionLetterPdfAssembler', () => {
  let assembler: RevisionLetterPdfAssembler;

  const revision = {
    currentRentCents: 85000,
    newRentCents: 87550,
    differenceCents: 2550,
    baseIndexValue: 142.06,
    baseIndexQuarter: 'T1',
    baseIndexYear: 2024,
    newIndexValue: 146.39,
    newIndexQuarter: 'T3',
    newIndexYear: 2025,
    revisionIndexType: 'IRL',
    approvedAt: new Date('2026-01-15T10:00:00Z'),
  };

  const entity = {
    name: 'SCI Les Oliviers',
    siret: '123 456 789 00012',
    addressStreet: '10 Rue des Lilas',
    addressPostalCode: '75001',
    addressCity: 'Paris',
    addressComplement: null,
  };

  const tenant = {
    type: 'individual',
    firstName: 'Jean',
    lastName: 'Dupont',
    companyName: null,
    addressStreet: '5 Avenue Victor Hugo',
    addressPostalCode: '69001',
    addressCity: 'Lyon',
    addressComplement: null,
  };

  const lease = {
    startDate: new Date('2025-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    assembler = new RevisionLetterPdfAssembler();
  });

  it('should assemble entity fields', () => {
    const result = assembler.assemble(revision, entity, tenant, lease);

    expect(result.entityName).toBe('SCI Les Oliviers');
    expect(result.entitySiret).toBe('123 456 789 00012');
    expect(result.entityAddress).toBe('10 Rue des Lilas, 75001 Paris');
    expect(result.city).toBe('Paris');
  });

  it('should assemble tenant fields for individual', () => {
    const result = assembler.assemble(revision, entity, tenant, lease);

    expect(result.tenantFirstName).toBe('Jean');
    expect(result.tenantLastName).toBe('Dupont');
    expect(result.tenantCompanyName).toBeNull();
    expect(result.tenantAddress).toBe('5 Avenue Victor Hugo, 69001 Lyon');
  });

  it('should assemble tenant fields for company', () => {
    const companyTenant = {
      ...tenant,
      type: 'company',
      companyName: 'SARL Immobilière',
    };
    const result = assembler.assemble(revision, entity, companyTenant, lease);

    expect(result.tenantCompanyName).toBe('SARL Immobilière');
  });

  it('should not expose company name for individual tenant even if set', () => {
    const weirdTenant = {
      ...tenant,
      type: 'individual',
      companyName: 'Should Not Appear',
    };
    const result = assembler.assemble(revision, entity, weirdTenant, lease);

    expect(result.tenantCompanyName).toBeNull();
  });

  it('should format lease start date as DD/MM/YYYY', () => {
    const result = assembler.assemble(revision, entity, tenant, lease);

    expect(result.leaseStartDate).toBe('01/01/2025');
  });

  it('should format revision date from approvedAt', () => {
    const result = assembler.assemble(revision, entity, tenant, lease);

    expect(result.revisionDate).toBe('15/01/2026');
  });

  it('should set effectiveDate equal to revisionDate', () => {
    const result = assembler.assemble(revision, entity, tenant, lease);

    expect(result.effectiveDate).toBe(result.revisionDate);
  });

  it('should assemble revision amounts', () => {
    const result = assembler.assemble(revision, entity, tenant, lease);

    expect(result.currentRentCents).toBe(85000);
    expect(result.newRentCents).toBe(87550);
    expect(result.differenceCents).toBe(2550);
  });

  it('should assemble formula components', () => {
    const result = assembler.assemble(revision, entity, tenant, lease);

    expect(result.revisionIndexType).toBe('IRL');
    expect(result.baseIndexQuarter).toBe('T1 2024');
    expect(result.baseIndexValue).toBe(142.06);
    expect(result.newIndexQuarter).toBe('T3 2025');
    expect(result.newIndexValue).toBe(146.39);
  });

  it('should format address with complement', () => {
    const entityWithComplement = {
      ...entity,
      addressComplement: 'Bât A',
    };
    const result = assembler.assemble(revision, entityWithComplement, tenant, lease);

    expect(result.entityAddress).toBe('10 Rue des Lilas, Bât A, 75001 Paris');
  });

  it('should handle null entity siret', () => {
    const entityNoSiret = { ...entity, siret: null };
    const result = assembler.assemble(revision, entityNoSiret, tenant, lease);

    expect(result.entitySiret).toBeNull();
  });

  it('should handle tenant with only city (no street)', () => {
    const tenantPartialAddress = {
      ...tenant,
      addressStreet: null,
      addressPostalCode: null,
    };
    const result = assembler.assemble(revision, entity, tenantPartialAddress, lease);

    expect(result.tenantAddress).toBe('Lyon');
  });

  it('should generate documentDate as today (UTC)', () => {
    const result = assembler.assemble(revision, entity, tenant, lease);

    const today = new Date();
    const expected = `${String(today.getUTCDate()).padStart(2, '0')}/${String(today.getUTCMonth() + 1).padStart(2, '0')}/${today.getUTCFullYear()}`;
    expect(result.documentDate).toBe(expected);
  });

  it('should use baseIndexYear for base quarter label', () => {
    const result = assembler.assemble(revision, entity, tenant, lease);

    expect(result.baseIndexQuarter).toBe('T1 2024');
    expect(result.newIndexQuarter).toBe('T3 2025');
  });

  it('should fallback to newIndexYear when baseIndexYear is null', () => {
    const revisionNoYear = { ...revision, baseIndexYear: null };
    const result = assembler.assemble(revisionNoYear, entity, tenant, lease);

    expect(result.baseIndexQuarter).toBe('T1 2025');
  });
});
