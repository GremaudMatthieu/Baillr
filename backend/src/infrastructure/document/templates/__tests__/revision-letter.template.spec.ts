import { renderRevisionLetterPdf } from '../revision-letter.template';
import type { RevisionLetterPdfData } from '../../revision-letter-pdf-data.interface';

describe('renderRevisionLetterPdf', () => {
  const baseData: RevisionLetterPdfData = {
    entityName: 'SCI Les Oliviers',
    entityAddress: '10 Rue des Lilas, 75001 Paris',
    entitySiret: '123 456 789 00012',
    tenantFirstName: 'Jean',
    tenantLastName: 'Dupont',
    tenantCompanyName: null,
    tenantAddress: '5 Avenue Victor Hugo, 69001 Lyon',
    leaseStartDate: '01/01/2025',
    revisionDate: '01/07/2026',
    currentRentCents: 85000,
    newRentCents: 87550,
    differenceCents: 2550,
    effectiveDate: '01/07/2026',
    revisionIndexType: 'IRL',
    baseIndexQuarter: 'T1 2025',
    baseIndexValue: 142.06,
    newIndexQuarter: 'T3 2025',
    newIndexValue: 146.39,
    documentDate: '14/02/2026',
    city: 'Paris',
  };

  let mockDoc: {
    fontSize: jest.Mock;
    font: jest.Mock;
    text: jest.Mock;
    moveDown: jest.Mock;
    y: number;
  };

  beforeEach(() => {
    mockDoc = {
      fontSize: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      y: 50,
    };
  });

  it('should render entity name as header', () => {
    renderRevisionLetterPdf(mockDoc as never, baseData);

    expect(mockDoc.text).toHaveBeenCalledWith(
      'SCI Les Oliviers',
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('should render entity SIRET when provided', () => {
    renderRevisionLetterPdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('SIRET'))).toBe(true);
  });

  it('should not render SIRET when null', () => {
    renderRevisionLetterPdf(mockDoc as never, { ...baseData, entitySiret: null });

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('SIRET'))).toBe(false);
  });

  it('should render AVIS DE RÉVISION DE LOYER title', () => {
    renderRevisionLetterPdf(mockDoc as never, baseData);

    expect(mockDoc.text).toHaveBeenCalledWith(
      'AVIS DE RÉVISION DE LOYER',
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({ align: 'center' }),
    );
  });

  it('should render tenant name for individual', () => {
    renderRevisionLetterPdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls).toContain('Jean Dupont');
  });

  it('should render company name for company tenant', () => {
    renderRevisionLetterPdf(mockDoc as never, {
      ...baseData,
      tenantCompanyName: 'SARL Immobilière',
    });

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls).toContain('SARL Immobilière');
  });

  it('should render lease start date', () => {
    renderRevisionLetterPdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('01/01/2025'))).toBe(true);
  });

  it('should render formula with index values', () => {
    renderRevisionLetterPdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('IRL'))).toBe(true);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('142.06'))).toBe(true);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('146.39'))).toBe(true);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('T1 2025'))).toBe(true);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('T3 2025'))).toBe(true);
  });

  it('should render new rent formula line', () => {
    renderRevisionLetterPdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    // Formula: Nouveau loyer = 850,00 € × (146.39 / 142.06) = 875,50 €
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('Nouveau loyer'))).toBe(true);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('850,00'))).toBe(true);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('875,50'))).toBe(true);
  });

  it('should render effective date', () => {
    renderRevisionLetterPdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(
      textCalls.some(
        (t: unknown) =>
          typeof t === 'string' &&
          t.includes('01/07/2026') &&
          t.includes('prendra effet'),
      ),
    ).toBe(true);
  });

  it('should render legal mention (article 17-1)', () => {
    renderRevisionLetterPdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('article 17-1'))).toBe(true);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('loi n° 89-462'))).toBe(true);
  });

  it('should render city and document date', () => {
    renderRevisionLetterPdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(
      textCalls.some(
        (t: unknown) =>
          typeof t === 'string' &&
          t.includes('Paris') &&
          t.includes('14/02/2026'),
      ),
    ).toBe(true);
  });

  it('should render closing formula', () => {
    renderRevisionLetterPdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('salutations distinguées'))).toBe(true);
  });

  it('should render variation with sign', () => {
    renderRevisionLetterPdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls.some((t: unknown) => typeof t === 'string' && t.includes('Variation') && t.includes('+'))).toBe(true);
  });

  it('should render tenant address', () => {
    renderRevisionLetterPdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls).toContain('5 Avenue Victor Hugo, 69001 Lyon');
  });

  it('should render entity address', () => {
    renderRevisionLetterPdf(mockDoc as never, baseData);

    const textCalls = mockDoc.text.mock.calls.map((c: unknown[]) => c[0]);
    expect(textCalls).toContain('10 Rue des Lilas, 75001 Paris');
  });
});
