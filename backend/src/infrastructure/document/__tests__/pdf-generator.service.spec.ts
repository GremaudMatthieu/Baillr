import { PdfGeneratorService } from '../pdf-generator.service';
import { makeTestPdfData as makeTestData } from './rent-call-pdf-data.fixture';

describe('PdfGeneratorService', () => {
  let service: PdfGeneratorService;

  beforeEach(() => {
    service = new PdfGeneratorService();
  });

  it('should generate a valid PDF buffer with all fields', async () => {
    const data = makeTestData();
    const buffer = await service.generateRentCallPdf(data);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should output a buffer starting with PDF header bytes', async () => {
    const data = makeTestData();
    const buffer = await service.generateRentCallPdf(data);

    const header = buffer.subarray(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');
  });

  it('should generate a PDF without IBAN section', async () => {
    const data = makeTestData({ iban: null, bic: null });
    const buffer = await service.generateRentCallPdf(data);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should generate a PDF for pro-rata rent call', async () => {
    const data = makeTestData({
      isProRata: true,
      occupiedDays: 15,
      totalDaysInMonth: 28,
      totalAmountCents: 45536,
      rentAmountCents: 40179,
    });
    const buffer = await service.generateRentCallPdf(data);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should include entity name and PDF metadata in output', async () => {
    const data = makeTestData();
    const buffer = await service.generateRentCallPdf(data);
    const content = buffer.toString('latin1');

    // Entity name appears in PDF info Author field (uncompressed)
    expect(content).toContain('SCI EXAMPLE');
    // PDF info contains Helvetica fonts used for rendering
    expect(content).toContain('/Helvetica-Bold');
  });
});
