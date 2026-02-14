import { FormalNoticePdfAssembler } from '../services/formal-notice-pdf-assembler.service';

describe('FormalNoticePdfAssembler', () => {
  const assembler = new FormalNoticePdfAssembler();

  const baseInput = {
    rentCall: {
      month: '2026-01',
      totalAmountCents: 85000,
      remainingBalanceCents: 85000,
    },
    tenant: {
      type: 'individual',
      firstName: 'Jean',
      lastName: 'Dupont',
      companyName: null,
      addressStreet: '5 Avenue Victor Hugo',
      addressPostalCode: '69001',
      addressCity: 'Lyon',
      addressComplement: null,
    },
    unit: { identifier: 'Apt 3B' },
    lease: { startDate: new Date('2025-01-01') },
    entity: {
      name: 'SCI Les Oliviers',
      siret: '123 456 789 00012',
      addressStreet: '10 Rue des Lilas',
      addressPostalCode: '75001',
      addressCity: 'Paris',
      addressComplement: null,
    },
    escalation: { tier1SentAt: new Date('2026-02-10') },
  };

  it('should assemble entity details', () => {
    const result = assembler.assemble(baseInput);

    expect(result.entityName).toBe('SCI Les Oliviers');
    expect(result.entityAddress).toBe('10 Rue des Lilas, 75001 Paris');
    expect(result.entitySiret).toBe('123 456 789 00012');
  });

  it('should assemble tenant details', () => {
    const result = assembler.assemble(baseInput);

    expect(result.tenantName).toBe('Jean Dupont');
    expect(result.tenantAddress).toBe('5 Avenue Victor Hugo, 69001 Lyon');
  });

  it('should format company tenant name', () => {
    const result = assembler.assemble({
      ...baseInput,
      tenant: { ...baseInput.tenant, type: 'company', companyName: 'SARL Boulangerie' },
    });

    expect(result.tenantName).toBe('SARL Boulangerie');
  });

  it('should assemble lease reference', () => {
    const result = assembler.assemble(baseInput);

    expect(result.leaseReference).toBe('01/01/2025');
  });

  it('should assemble unpaid period with remaining balance', () => {
    const result = assembler.assemble(baseInput);

    expect(result.unpaidPeriods).toEqual([
      { period: 'Janvier 2026', amountCents: 85000 },
    ]);
    expect(result.totalDebtCents).toBe(85000);
  });

  it('should use totalAmountCents when remainingBalanceCents is null', () => {
    const result = assembler.assemble({
      ...baseInput,
      rentCall: { ...baseInput.rentCall, remainingBalanceCents: null },
    });

    expect(result.totalDebtCents).toBe(85000);
  });

  it('should format tier 1 sent date', () => {
    const result = assembler.assemble(baseInput);

    expect(result.tier1SentAt).toBe('10/02/2026');
  });

  it('should handle null escalation', () => {
    const result = assembler.assemble({ ...baseInput, escalation: null });

    expect(result.tier1SentAt).toBeNull();
  });

  it('should set current date', () => {
    const result = assembler.assemble(baseInput);

    expect(result.date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});
