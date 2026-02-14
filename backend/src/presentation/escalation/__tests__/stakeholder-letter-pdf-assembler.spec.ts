import { StakeholderLetterPdfAssembler } from '../services/stakeholder-letter-pdf-assembler.service';

describe('StakeholderLetterPdfAssembler', () => {
  const assembler = new StakeholderLetterPdfAssembler();

  const baseInput = {
    recipientType: 'insurance' as const,
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
    escalation: {
      tier1SentAt: new Date('2026-02-10'),
      tier2SentAt: new Date('2026-02-18'),
    },
  };

  it('should set recipient type', () => {
    const result = assembler.assemble(baseInput);
    expect(result.recipientType).toBe('insurance');
  });

  it('should assemble entity details', () => {
    const result = assembler.assemble(baseInput);
    expect(result.entityName).toBe('SCI Les Oliviers');
    expect(result.entityAddress).toBe('10 Rue des Lilas, 75001 Paris');
  });

  it('should assemble tenant details', () => {
    const result = assembler.assemble(baseInput);
    expect(result.tenantName).toBe('Jean Dupont');
    expect(result.tenantAddress).toBe('5 Avenue Victor Hugo, 69001 Lyon');
  });

  it('should format escalation dates', () => {
    const result = assembler.assemble(baseInput);
    expect(result.tier1SentAt).toBe('10/02/2026');
    expect(result.tier2SentAt).toBe('18/02/2026');
  });

  it('should handle null escalation', () => {
    const result = assembler.assemble({ ...baseInput, escalation: null });
    expect(result.tier1SentAt).toBeNull();
    expect(result.tier2SentAt).toBeNull();
  });

  it('should support different recipient types', () => {
    for (const type of ['insurance', 'lawyer', 'guarantor'] as const) {
      const result = assembler.assemble({ ...baseInput, recipientType: type });
      expect(result.recipientType).toBe(type);
    }
  });
});
