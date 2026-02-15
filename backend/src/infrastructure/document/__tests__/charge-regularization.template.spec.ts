import { renderChargeRegularizationPdf } from '../templates/charge-regularization.template';
import type { ChargeRegularizationPdfData } from '../charge-regularization-pdf-data.interface';

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
    rect: jest.fn().mockReturnThis(),
    fill: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    y: 100,
    calls,
  };
  return spy;
}

function makeTestPdfData(
  overrides: Partial<ChargeRegularizationPdfData> = {},
): ChargeRegularizationPdfData {
  return {
    entityName: 'SCI EXAMPLE',
    entityAddress: '12 rue de la Paix, 75002 PARIS',
    entitySiret: '12345678901234',
    tenantName: 'Jean DUPONT',
    tenantAddress: '5 avenue Victor Hugo, 69003 LYON',
    unitIdentifier: 'Apt A',
    unitAddress: '10 boulevard Haussmann, 75009 PARIS',
    occupancyStart: '01/01/2025',
    occupancyEnd: '31/12/2025',
    occupiedDays: 365,
    daysInYear: 365,
    charges: [
      {
        label: 'TEOM',
        totalChargeCents: 80000,
        tenantShareCents: 80000,
        provisionsPaidCents: 75000,
        isWaterByConsumption: false,
      },
      {
        label: 'Eau',
        totalChargeCents: 45000,
        tenantShareCents: 30000,
        provisionsPaidCents: 0,
        isWaterByConsumption: true,
      },
    ],
    totalShareCents: 110000,
    totalProvisionsPaidCents: 100000,
    balanceCents: 10000,
    fiscalYear: 2025,
    documentDate: '15/02/2026',
    ...overrides,
  };
}

describe('renderChargeRegularizationPdf', () => {
  it('should render all required sections', () => {
    const data = makeTestPdfData();
    const doc = createDocSpy();
    renderChargeRegularizationPdf(
      doc as unknown as PDFKit.PDFDocument,
      data,
    );

    const texts = doc.calls
      .filter((c) => c.method === 'text')
      .map((c) => c.args[0] as string);

    // Entity header
    expect(texts).toContain('SCI EXAMPLE');
    expect(texts.some((t) => t.includes('SIRET'))).toBe(true);

    // Tenant
    expect(texts).toContain('Jean DUPONT');

    // Title
    expect(
      texts.some((t) => t.includes('DÉCOMPTE DE RÉGULARISATION')),
    ).toBe(true);

    // Fiscal year
    expect(texts.some((t) => t.includes('2025'))).toBe(true);

    // Unit
    expect(texts.some((t) => t.includes('Apt A'))).toBe(true);

    // Occupancy
    expect(
      texts.some((t) => t.includes('01/01/2025') && t.includes('31/12/2025')),
    ).toBe(true);

    // Charge labels
    expect(texts).toContain('TEOM');
    expect(texts).toContain('Eau');

    // Notes column
    expect(texts).toContain('Prorata');
    expect(texts).toContain('Conso.');

    // Balance section
    expect(
      texts.some((t) => t.includes('Complément à régler')),
    ).toBe(true);

    // Legal footer
    expect(texts.some((t) => t.includes('article 23'))).toBe(true);

    // Document date
    expect(texts.some((t) => t.includes('15/02/2026'))).toBe(true);
  });

  it('should format amounts in French currency', () => {
    const data = makeTestPdfData();
    const doc = createDocSpy();
    renderChargeRegularizationPdf(
      doc as unknown as PDFKit.PDFDocument,
      data,
    );

    const texts = doc.calls
      .filter((c) => c.method === 'text')
      .map((c) => c.args[0] as string);

    // Use regex with . for whitespace (narrow no-break space in Intl)
    expect(texts.some((t) => /800,00.€/.test(t))).toBe(true); // TEOM total
    expect(texts.some((t) => /1.100,00.€/.test(t))).toBe(true); // total share
    expect(texts.some((t) => /1.000,00.€/.test(t))).toBe(true); // provisions
    expect(texts.some((t) => /100,00.€/.test(t))).toBe(true); // balance
  });

  it('should show trop-perçu for negative balance', () => {
    const data = makeTestPdfData({ balanceCents: -5000 });
    const doc = createDocSpy();
    renderChargeRegularizationPdf(
      doc as unknown as PDFKit.PDFDocument,
      data,
    );

    const texts = doc.calls
      .filter((c) => c.method === 'text')
      .map((c) => c.args[0] as string);

    expect(texts.some((t) => t.includes('Trop-perçu'))).toBe(true);
  });

  it('should show zero balance message', () => {
    const data = makeTestPdfData({ balanceCents: 0 });
    const doc = createDocSpy();
    renderChargeRegularizationPdf(
      doc as unknown as PDFKit.PDFDocument,
      data,
    );

    const texts = doc.calls
      .filter((c) => c.method === 'text')
      .map((c) => c.args[0] as string);

    expect(texts.some((t) => t.includes('Solde nul'))).toBe(true);
  });

  it('should omit SIRET when null', () => {
    const data = makeTestPdfData({ entitySiret: null });
    const doc = createDocSpy();
    renderChargeRegularizationPdf(
      doc as unknown as PDFKit.PDFDocument,
      data,
    );

    const texts = doc.calls
      .filter((c) => c.method === 'text')
      .map((c) => c.args[0] as string);

    expect(texts.some((t) => t.includes('SIRET'))).toBe(false);
  });
});
