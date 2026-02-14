import { renderFormalNoticePdf } from '../formal-notice.template';
import type { FormalNoticePdfData } from '../../formal-notice-pdf-data.interface';

describe('renderFormalNoticePdf', () => {
  const baseData: FormalNoticePdfData = {
    entityName: 'SCI Les Oliviers',
    entityAddress: '10 Rue des Lilas, 75001 Paris',
    entitySiret: '123 456 789 00012',
    tenantName: 'Jean Dupont',
    tenantAddress: '5 Avenue Victor Hugo, 69001 Lyon',
    leaseReference: '01/01/2025',
    unitIdentifier: 'Apt 3B',
    unpaidPeriods: [
      { period: 'Janvier 2026', amountCents: 85000 },
    ],
    totalDebtCents: 85000,
    tier1SentAt: '10/02/2026',
    date: '14/02/2026',
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
    renderFormalNoticePdf(mockDoc as never, baseData);

    expect(mockDoc.text).toHaveBeenCalledWith(
      'SCI Les Oliviers',
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('should render MISE EN DEMEURE title', () => {
    renderFormalNoticePdf(mockDoc as never, baseData);

    expect(mockDoc.text).toHaveBeenCalledWith(
      'MISE EN DEMEURE',
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: 'center' }),
    );
  });

  it('should render tenant name and address', () => {
    renderFormalNoticePdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls).toContain('Jean Dupont');
  });

  it('should render lease reference', () => {
    renderFormalNoticePdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('01/01/2025'))).toBe(true);
  });

  it('should render tier 1 escalation history when present', () => {
    renderFormalNoticePdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('10/02/2026'))).toBe(true);
  });

  it('should not render tier 1 history when absent', () => {
    renderFormalNoticePdf(mockDoc as never, { ...baseData, tier1SentAt: null });

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('relance amiable'))).toBe(false);
  });

  it('should render legal mentions', () => {
    renderFormalNoticePdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('loi n° 89-462'))).toBe(true);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('8 jours'))).toBe(true);
  });

  it('should render formal demand with amount', () => {
    renderFormalNoticePdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('850,00'))).toBe(true);
  });

  it('should render consequences paragraph', () => {
    renderFormalNoticePdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('action judiciaire'))).toBe(true);
  });
});
