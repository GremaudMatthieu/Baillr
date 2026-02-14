import { renderReceiptPdf } from '../templates/receipt.template';
import { makeTestReceiptData } from './receipt-pdf-data.fixture';

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
    currentLineHeight: jest.fn().mockReturnValue(12),
    y: 100,
    calls,
  };
  return spy;
}

describe('renderReceiptPdf — quittance', () => {
  it('should display QUITTANCE DE LOYER as title', () => {
    const data = makeTestReceiptData({ receiptType: 'quittance' });
    const doc = createDocSpy();
    renderReceiptPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls.filter((c) => c.method === 'text').map((c) => c.args[0] as string);
    expect(texts.some((t) => t.includes('QUITTANCE DE LOYER'))).toBe(true);
  });

  it('should display payment confirmation date', () => {
    const data = makeTestReceiptData({ receiptType: 'quittance', paymentDate: '10/02/2026' });
    const doc = createDocSpy();
    renderReceiptPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls.filter((c) => c.method === 'text').map((c) => c.args[0] as string);
    expect(texts.some((t) => t.includes('Payé le 10/02/2026'))).toBe(true);
  });

  it('should include quittance legal mention', () => {
    const data = makeTestReceiptData({ receiptType: 'quittance' });
    const doc = createDocSpy();
    renderReceiptPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls.filter((c) => c.method === 'text').map((c) => c.args[0] as string);
    expect(texts.some((t) => t.includes('article 21'))).toBe(true);
    expect(texts.some((t) => t.includes('annule et remplace'))).toBe(true);
  });

  it('should display TOTAL label for quittance', () => {
    const data = makeTestReceiptData({ receiptType: 'quittance' });
    const doc = createDocSpy();
    renderReceiptPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls.filter((c) => c.method === 'text').map((c) => c.args[0] as string);
    expect(texts).toContain('TOTAL');
  });

  it('should render entity and tenant information', () => {
    const data = makeTestReceiptData();
    const doc = createDocSpy();
    renderReceiptPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls.filter((c) => c.method === 'text').map((c) => c.args[0] as string);
    expect(texts).toContain('SCI EXAMPLE');
    expect(texts).toContain('Jean DUPONT');
  });

  it('should format amounts in French currency', () => {
    const data = makeTestReceiptData();
    const doc = createDocSpy();
    renderReceiptPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls.filter((c) => c.method === 'text').map((c) => c.args[0] as string);
    expect(texts.some((t) => /750,00.€/.test(t))).toBe(true);
    expect(texts.some((t) => /850,00.€/.test(t))).toBe(true);
  });
});

describe('renderReceiptPdf — reçu de paiement', () => {
  it('should display REÇU DE PAIEMENT PARTIEL as title', () => {
    const data = makeTestReceiptData({
      receiptType: 'recu_paiement',
      totalPaidCents: 50000,
      remainingBalanceCents: 35000,
    });
    const doc = createDocSpy();
    renderReceiptPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls.filter((c) => c.method === 'text').map((c) => c.args[0] as string);
    expect(texts.some((t) => t.includes('REÇU DE PAIEMENT PARTIEL'))).toBe(true);
  });

  it('should display TOTAL DÛ label for partial receipt', () => {
    const data = makeTestReceiptData({ receiptType: 'recu_paiement' });
    const doc = createDocSpy();
    renderReceiptPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls.filter((c) => c.method === 'text').map((c) => c.args[0] as string);
    expect(texts.some((t) => t.includes('TOTAL DÛ'))).toBe(true);
  });

  it('should include partial payment disclaimer', () => {
    const data = makeTestReceiptData({
      receiptType: 'recu_paiement',
      remainingBalanceCents: 35000,
    });
    const doc = createDocSpy();
    renderReceiptPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls.filter((c) => c.method === 'text').map((c) => c.args[0] as string);
    expect(texts.some((t) => t.includes('ne constitue pas une quittance'))).toBe(true);
    expect(texts.some((t) => t.includes('solde restant dû'))).toBe(true);
  });

  it('should render payment history section', () => {
    const data = makeTestReceiptData({
      receiptType: 'recu_paiement',
      payments: [
        { date: '05/02/2026', amountCents: 30000, method: 'Espèces' },
        { date: '10/02/2026', amountCents: 20000, method: 'Chèque' },
      ],
    });
    const doc = createDocSpy();
    renderReceiptPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls.filter((c) => c.method === 'text').map((c) => c.args[0] as string);
    expect(texts.some((t) => t.includes('Paiements reçus'))).toBe(true);
    expect(texts).toContain('05/02/2026');
    expect(texts).toContain('10/02/2026');
    expect(texts).toContain('Espèces');
    expect(texts).toContain('Chèque');
  });

  it('should display total paid and remaining balance', () => {
    const data = makeTestReceiptData({
      receiptType: 'recu_paiement',
      totalPaidCents: 50000,
      remainingBalanceCents: 35000,
    });
    const doc = createDocSpy();
    renderReceiptPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls.filter((c) => c.method === 'text').map((c) => c.args[0] as string);
    expect(texts.some((t) => t.includes('Total payé'))).toBe(true);
    expect(texts.some((t) => t.includes('Solde restant dû'))).toBe(true);
    expect(texts.some((t) => /500,00.€/.test(t))).toBe(true);
    expect(texts.some((t) => /350,00.€/.test(t))).toBe(true);
  });
});

describe('renderReceiptPdf — common', () => {
  it('should render billing lines', () => {
    const data = makeTestReceiptData({
      billingLines: [
        { label: 'Provisions sur charges', amountCents: 10000, type: 'provision' },
        { label: 'Ordures ménagères', amountCents: 3000, type: 'provision' },
      ],
    });
    const doc = createDocSpy();
    renderReceiptPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls.filter((c) => c.method === 'text').map((c) => c.args[0] as string);
    expect(texts).toContain('Loyer');
    expect(texts).toContain('Provisions sur charges');
    expect(texts).toContain('Ordures ménagères');
  });

  it('should include pro-rata note when isProRata is true', () => {
    const data = makeTestReceiptData({
      isProRata: true,
      occupiedDays: 15,
      totalDaysInMonth: 28,
    });
    const doc = createDocSpy();
    renderReceiptPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls.filter((c) => c.method === 'text').map((c) => c.args[0] as string);
    expect(texts.some((t) => t.includes('Prorata : 15/28 jours'))).toBe(true);
  });

  it('should include SIRET when available', () => {
    const data = makeTestReceiptData({ entitySiret: '12345678901234' });
    const doc = createDocSpy();
    renderReceiptPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls.filter((c) => c.method === 'text').map((c) => c.args[0] as string);
    expect(texts.some((t) => t.includes('SIRET : 12345678901234'))).toBe(true);
  });

  it('should include unit and lease reference', () => {
    const data = makeTestReceiptData();
    const doc = createDocSpy();
    renderReceiptPdf(doc as unknown as PDFKit.PDFDocument, data);

    const texts = doc.calls.filter((c) => c.method === 'text').map((c) => c.args[0] as string);
    expect(texts.some((t) => t.includes('Apt 101'))).toBe(true);
    expect(texts.some((t) => t.includes('01/01/2025'))).toBe(true);
  });
});
