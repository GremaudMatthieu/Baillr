import { renderRentCallPdf } from '../templates/rent-call.template';
import { makeTestPdfData as makeTestData } from './rent-call-pdf-data.fixture';

function createDocSpy() {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const spy = {
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    text: jest.fn().mockImplementation(function (this: typeof spy) {
      calls.push({ method: 'text', args: [...arguments] });
      return this;
    }),
    moveDown: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    y: 100,
    calls,
  };
  return spy;
}

describe('renderRentCallPdf', () => {
  it('should render all required sections', () => {
    const data = makeTestData();
    const doc = createDocSpy();
    renderRentCallPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls
      .filter((c) => c.method === 'text')
      .map((c) => c.args[0] as string);

    expect(texts).toContain('SCI EXAMPLE');
    expect(texts).toContain('Jean DUPONT');
    expect(texts.some((t) => t.includes("AVIS D'ÉCHÉANCE"))).toBe(true);
    expect(texts.some((t) => t.includes('Février 2026'))).toBe(true);
    expect(texts.some((t) => t.includes('Apt 101'))).toBe(true);
    expect(texts.some((t) => t.includes('01/01/2025'))).toBe(true);
    expect(texts).toContain('Loyer');
    expect(texts).toContain('Provisions sur charges');
    expect(texts).toContain('TOTAL');
    expect(texts.some((t) => t.includes('exigibilité'))).toBe(true);
    expect(texts.some((t) => t.includes('article 21'))).toBe(true);
  });

  it('should format amounts in French currency', () => {
    const data = makeTestData();
    const doc = createDocSpy();
    renderRentCallPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls
      .filter((c) => c.method === 'text')
      .map((c) => c.args[0] as string);

    // Use regex with . for whitespace characters (narrow no-break space in Intl)
    expect(texts.some((t) => /750,00.€/.test(t))).toBe(true);
    expect(texts.some((t) => /100,00.€/.test(t))).toBe(true);
    expect(texts.some((t) => /850,00.€/.test(t))).toBe(true);
  });

  it('should omit IBAN section when iban is null', () => {
    const data = makeTestData({ iban: null, bic: null });
    const doc = createDocSpy();
    renderRentCallPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls
      .filter((c) => c.method === 'text')
      .map((c) => c.args[0] as string);

    expect(texts.some((t) => t.includes('IBAN'))).toBe(false);
    expect(texts.some((t) => t.includes('BIC'))).toBe(false);
    expect(texts.some((t) => t.includes('virement'))).toBe(false);
  });

  it('should include pro-rata note when isProRata is true', () => {
    const data = makeTestData({
      isProRata: true,
      occupiedDays: 15,
      totalDaysInMonth: 28,
    });
    const doc = createDocSpy();
    renderRentCallPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls
      .filter((c) => c.method === 'text')
      .map((c) => c.args[0] as string);

    expect(texts.some((t) => t.includes('Prorata : 15/28 jours'))).toBe(true);
  });
});
