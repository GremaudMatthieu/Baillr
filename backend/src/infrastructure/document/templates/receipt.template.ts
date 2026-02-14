import type { ReceiptPdfData } from '../receipt-pdf-data.interface.js';
import { formatEuroCents } from '../format-euro.util.js';
import { A4_PAGE_WIDTH, DEFAULT_MARGIN } from './pdf-constants.js';

export function renderReceiptPdf(
  doc: PDFKit.PDFDocument,
  data: ReceiptPdfData,
): void {
  const pageWidth = A4_PAGE_WIDTH;
  const margin = DEFAULT_MARGIN;
  const contentWidth = pageWidth - margin * 2;

  // === HEADER: Entity info (top-left) ===
  doc.fontSize(16).font('Helvetica-Bold').text(data.entityName, margin, margin);
  doc.fontSize(10).font('Helvetica');
  doc.text(data.entityAddress);
  if (data.entitySiret) {
    doc.text(`SIRET : ${data.entitySiret}`);
  }

  // === RECIPIENT BLOCK (right-aligned) ===
  const recipientY = margin;
  doc.fontSize(10).font('Helvetica');
  doc.text(data.tenantName, margin + contentWidth / 2, recipientY, {
    width: contentWidth / 2,
    align: 'right',
  });
  doc.text(data.tenantAddress, {
    width: contentWidth / 2,
    align: 'right',
  });

  // === TITLE ===
  const titleY = Math.max(doc.y, margin + 100) + 20;
  const title =
    data.receiptType === 'quittance'
      ? 'QUITTANCE DE LOYER'
      : 'REÇU DE PAIEMENT PARTIEL';
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(title, margin, titleY, {
      width: contentWidth,
      align: 'center',
    });

  // === SUBTITLE ===
  doc.moveDown(0.5);
  doc
    .fontSize(11)
    .font('Helvetica')
    .text(`Période : ${data.billingPeriod}`, { width: contentWidth, align: 'center' });

  // === REFERENCE ===
  doc.moveDown(1);
  doc.fontSize(10).font('Helvetica');
  doc.text(`Lot : ${data.unitIdentifier}`, margin);
  doc.text(`Bail débutant le : ${data.leaseReference}`);

  // === BILLING TABLE ===
  doc.moveDown(1);
  const tableX = margin;
  const labelColWidth = contentWidth * 0.65;
  const amountColWidth = contentWidth * 0.35;
  let tableY = doc.y;

  // Table header
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Désignation', tableX, tableY, { width: labelColWidth });
  doc.text('Montant', tableX + labelColWidth, tableY, {
    width: amountColWidth,
    align: 'right',
  });

  tableY = doc.y + 5;
  doc
    .moveTo(tableX, tableY)
    .lineTo(tableX + contentWidth, tableY)
    .stroke();
  tableY += 8;

  // Rent line (always first)
  doc.font('Helvetica').fontSize(10);
  doc.text('Loyer', tableX, tableY, { width: labelColWidth });
  doc.text(formatEuroCents(data.rentAmountCents), tableX + labelColWidth, tableY, {
    width: amountColWidth,
    align: 'right',
  });
  tableY = doc.y + 4;

  // Additional billing lines
  for (const line of data.billingLines) {
    doc.text(line.label, tableX, tableY, { width: labelColWidth });
    doc.text(formatEuroCents(line.amountCents), tableX + labelColWidth, tableY, {
      width: amountColWidth,
      align: 'right',
    });
    tableY = doc.y + 4;
  }

  // Total separator
  doc
    .moveTo(tableX, tableY)
    .lineTo(tableX + contentWidth, tableY)
    .stroke();
  tableY += 8;

  // Total line
  doc.font('Helvetica-Bold').fontSize(10);
  const totalLabel = data.receiptType === 'quittance' ? 'TOTAL' : 'TOTAL DÛ';
  doc.text(totalLabel, tableX, tableY, { width: labelColWidth });
  doc.text(formatEuroCents(data.totalAmountCents), tableX + labelColWidth, tableY, {
    width: amountColWidth,
    align: 'right',
  });

  // === PRO-RATA NOTE (conditional) ===
  if (data.isProRata && data.occupiedDays != null && data.totalDaysInMonth != null) {
    doc.moveDown(0.5);
    doc
      .font('Helvetica-Oblique')
      .fontSize(9)
      .text(
        `Prorata : ${data.occupiedDays}/${data.totalDaysInMonth} jours`,
        margin,
      );
  }

  if (data.receiptType === 'quittance') {
    renderQuittanceFooter(doc, data, margin, contentWidth);
  } else {
    renderRecuFooter(doc, data, margin, contentWidth, tableX, labelColWidth, amountColWidth);
  }
}

function renderQuittanceFooter(
  doc: PDFKit.PDFDocument,
  data: ReceiptPdfData,
  margin: number,
  contentWidth: number,
): void {
  // === PAYMENT CONFIRMATION ===
  doc.moveDown(1.5);
  doc
    .font('Helvetica')
    .fontSize(10)
    .text(`Payé le ${data.paymentDate}`, margin);

  // === PAYMENT INFO (conditional) ===
  if (data.iban) {
    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(10).text('Règlement par virement bancaire :', margin);
    doc.font('Helvetica').fontSize(10);
    doc.text(`IBAN : ${data.iban}`);
    if (data.bic) {
      doc.text(`BIC  : ${data.bic}`);
    }
  }

  // === LEGAL FOOTER ===
  doc.moveDown(2);
  doc
    .moveTo(margin, doc.y)
    .lineTo(margin + contentWidth, doc.y)
    .stroke();
  doc.moveDown(0.5);
  doc
    .font('Helvetica-Oblique')
    .fontSize(8)
    .text(
      "Pour acquit, la présente quittance est délivrée en application de l'article 21 de la loi n° 89-462 du 6 juillet 1989. La présente quittance annule et remplace tout reçu de paiement partiel précédemment délivré pour la même période.",
      margin,
      undefined,
      { width: contentWidth, align: 'center' },
    );
}

function renderRecuFooter(
  doc: PDFKit.PDFDocument,
  data: ReceiptPdfData,
  margin: number,
  contentWidth: number,
  tableX: number,
  labelColWidth: number,
  amountColWidth: number,
): void {
  // === PAYMENT HISTORY TABLE ===
  doc.moveDown(1.5);
  doc.font('Helvetica-Bold').fontSize(10).text('Paiements reçus :', margin);
  doc.moveDown(0.5);

  let payY = doc.y;

  // Payment history header
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('Date', tableX, payY, { width: labelColWidth * 0.35 });
  doc.text('Mode', tableX + labelColWidth * 0.35, payY, { width: labelColWidth * 0.35 });
  doc.text('Montant', tableX + labelColWidth * 0.7, payY, {
    width: contentWidth - labelColWidth * 0.7,
    align: 'right',
  });

  payY = doc.y + 3;
  doc
    .moveTo(tableX, payY)
    .lineTo(tableX + contentWidth, payY)
    .stroke();
  payY += 6;

  doc.font('Helvetica').fontSize(9);
  for (const payment of data.payments) {
    doc.text(payment.date, tableX, payY, { width: labelColWidth * 0.35 });
    doc.text(payment.method, tableX + labelColWidth * 0.35, payY, { width: labelColWidth * 0.35 });
    doc.text(formatEuroCents(payment.amountCents), tableX + labelColWidth * 0.7, payY, {
      width: contentWidth - labelColWidth * 0.7,
      align: 'right',
    });
    payY = doc.y + 4;
  }

  // Total paid line
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Total payé', tableX, doc.y, { width: labelColWidth });
  doc.text(formatEuroCents(data.totalPaidCents), tableX + labelColWidth, doc.y - doc.currentLineHeight(), {
    width: amountColWidth,
    align: 'right',
  });

  // Remaining balance line
  doc.moveDown(0.5);
  doc.text('Solde restant dû', tableX, doc.y, { width: labelColWidth });
  doc.text(formatEuroCents(data.remainingBalanceCents), tableX + labelColWidth, doc.y - doc.currentLineHeight(), {
    width: amountColWidth,
    align: 'right',
  });

  // === LEGAL DISCLAIMER ===
  doc.moveDown(2);
  doc
    .moveTo(margin, doc.y)
    .lineTo(margin + contentWidth, doc.y)
    .stroke();
  doc.moveDown(0.5);
  doc
    .font('Helvetica-Oblique')
    .fontSize(8)
    .text(
      `Le présent reçu ne constitue pas une quittance de loyer au sens de l'article 21 de la loi n° 89-462 du 6 juillet 1989. Le solde restant dû est de ${formatEuroCents(data.remainingBalanceCents)}.`,
      margin,
      undefined,
      { width: contentWidth, align: 'center' },
    );
}
