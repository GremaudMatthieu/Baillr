import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { RentCallPdfData } from './rent-call-pdf-data.interface.js';
import type { ReceiptPdfData } from './receipt-pdf-data.interface.js';
import type { FormalNoticePdfData } from './formal-notice-pdf-data.interface.js';
import type { StakeholderLetterPdfData } from './stakeholder-letter-pdf-data.interface.js';
import type { RevisionLetterPdfData } from './revision-letter-pdf-data.interface.js';
import type { ChargeRegularizationPdfData } from './charge-regularization-pdf-data.interface.js';
import { renderRentCallPdf } from './templates/rent-call.template.js';
import { renderReceiptPdf } from './templates/receipt.template.js';
import { renderFormalNoticePdf } from './templates/formal-notice.template.js';
import { renderStakeholderLetterPdf } from './templates/stakeholder-letter.template.js';
import { renderRevisionLetterPdf } from './templates/revision-letter.template.js';
import { renderChargeRegularizationPdf } from './templates/charge-regularization.template.js';

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

  async generateReceiptPdf(data: ReceiptPdfData): Promise<Buffer> {
    const subject =
      data.receiptType === 'quittance'
        ? 'Quittance de loyer'
        : 'Reçu de paiement partiel';

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `${subject} - ${data.tenantName} - ${data.billingPeriod}`,
          Author: data.entityName,
          Subject: subject,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      renderReceiptPdf(doc, data);
      doc.end();
    });
  }

  async generateFormalNoticePdf(data: FormalNoticePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Mise en demeure - ${data.tenantName}`,
          Author: data.entityName,
          Subject: 'Mise en demeure de paiement',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      renderFormalNoticePdf(doc, data);
      doc.end();
    });
  }

  async generateStakeholderLetterPdf(data: StakeholderLetterPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Signalement impayés - ${data.tenantName}`,
          Author: data.entityName,
          Subject: 'Signalement de loyers impayés',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      renderStakeholderLetterPdf(doc, data);
      doc.end();
    });
  }

  async generateRevisionLetterPdf(data: RevisionLetterPdfData): Promise<Buffer> {
    const tenantName = data.tenantCompanyName ?? `${data.tenantFirstName} ${data.tenantLastName}`;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Lettre de révision - ${tenantName}`,
          Author: data.entityName,
          Subject: 'Avis de révision de loyer',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      renderRevisionLetterPdf(doc, data);
      doc.end();
    });
  }

  async generateChargeRegularizationPdf(data: ChargeRegularizationPdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Régularisation des charges - ${data.tenantName} - ${data.fiscalYear}`,
          Author: data.entityName,
          Subject: 'Décompte de régularisation des charges',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      renderChargeRegularizationPdf(doc, data);
      doc.end();
    });
  }
}
