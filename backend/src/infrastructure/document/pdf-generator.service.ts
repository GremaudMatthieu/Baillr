import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { RentCallPdfData } from './rent-call-pdf-data.interface.js';
import { renderRentCallPdf } from './templates/rent-call.template.js';

@Injectable()
export class PdfGeneratorService {
  async generateRentCallPdf(data: RentCallPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Avis d'échéance - ${data.tenantName} - ${data.billingPeriod}`,
          Author: data.entityName,
          Subject: "Avis d'échéance de loyer",
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      renderRentCallPdf(doc, data);
      doc.end();
    });
  }
}
