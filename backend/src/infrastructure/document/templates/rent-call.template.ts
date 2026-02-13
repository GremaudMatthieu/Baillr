import type { RentCallPdfData } from '../rent-call-pdf-data.interface.js';
import { formatEuroCents } from '../format-euro.util.js';

export function renderRentCallPdf(
  doc: PDFKit.PDFDocument,
  data: RentCallPdfData,
): void {
  const pageWidth = 595.28;
  const margin = 50;
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
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text("AVIS D'ÉCHÉANCE", margin, titleY, {
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
  doc.text('TOTAL', tableX, tableY, { width: labelColWidth });
  doc.text(formatEuroCents(data.totalAmountCents), tableX + labelColWidth, tableY, {
    width: amountColWidth,
    align: 'right',
  });
  tableY = doc.y + 8;

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

  // === DUE DATE ===
  doc.moveDown(1);
  doc
    .font('Helvetica')
    .fontSize(10)
    .text(`Date d'exigibilité : le ${data.dueDate} de chaque mois`, margin);

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
  // Text specified verbatim in story AC — verify with a legal professional before production use
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
      "Avis d'échéance envoyé à titre gratuit conformément à l'article 21 de la loi n° 89-462 du 6 juillet 1989",
      margin,
      undefined,
      { width: contentWidth, align: 'center' },
    );
}
