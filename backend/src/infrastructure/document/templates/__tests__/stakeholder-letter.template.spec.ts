import { renderStakeholderLetterPdf } from '../stakeholder-letter.template';
import type { StakeholderLetterPdfData } from '../../stakeholder-letter-pdf-data.interface';

describe('renderStakeholderLetterPdf', () => {
  const baseData: StakeholderLetterPdfData = {
    recipientType: 'insurance',
    entityName: 'SCI Les Oliviers',
    entityAddress: '10 Rue des Lilas, 75001 Paris',
    entitySiret: '123 456 789 00012',
    tenantName: 'Jean Dupont',
    tenantAddress: '5 Avenue Victor Hugo, 69001 Lyon',
    leaseReference: '01/01/2025',
    unitIdentifier: 'Apt 3B',
    totalDebtCents: 85000,
    unpaidPeriods: [
      { period: 'Janvier 2026', amountCents: 85000 },
    ],
    tier1SentAt: '10/02/2026',
    tier2SentAt: '18/02/2026',
    date: '26/02/2026',
  };

  let mockDoc: {
    fontSize: jest.Mock;
    font: jest.Mock;
    text: jest.Mock;
    moveDown: jest.Mock;
    moveTo: jest.Mock;
    lineTo: jest.Mock;
    stroke: jest.Mock;
    y: number;
  };

  beforeEach(() => {
    mockDoc = {
      fontSize: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      y: 50,
    };
  });

  it('should render entity name as header', () => {
    renderStakeholderLetterPdf(mockDoc as never, baseData);

    expect(mockDoc.text).toHaveBeenCalledWith(
      'SCI Les Oliviers',
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('should render SIGNALEMENT title', () => {
    renderStakeholderLetterPdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls).toContain('SIGNALEMENT DE LOYERS IMPAYÉS');
  });

  it('should render insurance-specific body for insurance type', () => {
    renderStakeholderLetterPdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('assurance loyers impayés'))).toBe(true);
  });

  it('should render lawyer-specific body for lawyer type', () => {
    renderStakeholderLetterPdf(mockDoc as never, { ...baseData, recipientType: 'lawyer' });

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('procédure de recouvrement'))).toBe(true);
  });

  it('should render guarantor-specific body for guarantor type', () => {
    renderStakeholderLetterPdf(mockDoc as never, { ...baseData, recipientType: 'guarantor' });

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('clause de cautionnement'))).toBe(true);
  });

  it('should render escalation history with both tiers', () => {
    renderStakeholderLetterPdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('10/02/2026'))).toBe(true);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('18/02/2026'))).toBe(true);
  });

  it('should handle missing escalation history', () => {
    renderStakeholderLetterPdf(mockDoc as never, {
      ...baseData,
      tier1SentAt: null,
      tier2SentAt: null,
    });

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('Aucune démarche préalable'))).toBe(true);
  });

  it('should render debt amount', () => {
    renderStakeholderLetterPdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('850,00'))).toBe(true);
  });
});
