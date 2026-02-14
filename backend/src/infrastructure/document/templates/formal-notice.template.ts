import type { FormalNoticePdfData } from '../formal-notice-pdf-data.interface.js';
import { formatEuroCents } from '../format-euro.util.js';
import { A4_PAGE_WIDTH, DEFAULT_MARGIN } from './pdf-constants.js';

export function renderFormalNoticePdf(
  doc: PDFKit.PDFDocument,
  data: FormalNoticePdfData,
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

  // === DATE ===
  const dateY = Math.max(doc.y, margin + 100) + 10;
  doc.fontSize(10).font('Helvetica').text(`Fait le ${data.date}`, margin, dateY, {
    width: contentWidth,
    align: 'right',
  });

  // === TITLE ===
  doc.moveDown(2);
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('MISE EN DEMEURE', margin, doc.y, {
      width: contentWidth,
      align: 'center',
    });

  // === OBJECT LINE ===
  doc.moveDown(1);
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Objet : ', margin, doc.y, { continued: true });
  doc.font('Helvetica').text('Mise en demeure de payer les loyers impayés');

  // === LEASE REFERENCE ===
  doc.moveDown(0.5);
  doc.text(`Bail débutant le : ${data.leaseReference}`);
  doc.text(`Lot : ${data.unitIdentifier}`);

  // === BODY ===
  doc.moveDown(1);
  doc.text('Madame, Monsieur,');
  doc.moveDown(0.5);
  doc.text(
    'Malgré nos précédentes relances, nous constatons que les loyers suivants restent impayés à ce jour :',
  );

  // === UNPAID PERIODS TABLE ===
  doc.moveDown(0.5);
  const tableX = margin + 20;
  const labelColWidth = contentWidth * 0.55;
  const amountColWidth = contentWidth * 0.35;
  let tableY = doc.y;

  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Période', tableX, tableY, { width: labelColWidth });
  doc.text('Montant', tableX + labelColWidth, tableY, {
    width: amountColWidth,
    align: 'right',
  });

  tableY = doc.y + 5;
  doc
    .moveTo(tableX, tableY)
    .lineTo(tableX + labelColWidth + amountColWidth, tableY)
    .stroke();
  tableY += 8;

  doc.font('Helvetica').fontSize(10);
  for (const period of data.unpaidPeriods) {
    doc.text(period.period, tableX, tableY, { width: labelColWidth });
    doc.text(formatEuroCents(period.amountCents), tableX + labelColWidth, tableY, {
      width: amountColWidth,
      align: 'right',
    });
    tableY = doc.y + 4;
  }

  // Total separator
  doc
    .moveTo(tableX, tableY)
    .lineTo(tableX + labelColWidth + amountColWidth, tableY)
    .stroke();
  tableY += 8;

  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('TOTAL', tableX, tableY, { width: labelColWidth });
  doc.text(formatEuroCents(data.totalDebtCents), tableX + labelColWidth, tableY, {
    width: amountColWidth,
    align: 'right',
  });

  // === ESCALATION HISTORY ===
  if (data.tier1SentAt) {
    doc.moveDown(1);
    doc
      .font('Helvetica')
      .fontSize(10)
      .text(`Une relance amiable vous a été adressée le ${data.tier1SentAt}.`);
  }

  // === FORMAL DEMAND ===
  doc.moveDown(1);
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(
      `Je vous mets en demeure de régler la somme de ${formatEuroCents(data.totalDebtCents)} dans un délai de 8 jours à compter de la réception de la présente.`,
    );

  // === LEGAL MENTION ===
  doc.moveDown(1);
  doc
    .font('Helvetica')
    .fontSize(10)
    .text(
      "En application des articles 7 et 24 de la loi n° 89-462 du 6 juillet 1989, le paiement du loyer et des charges est une obligation du locataire. Le défaut de paiement peut entraîner la résiliation du bail et l'expulsion du locataire.",
    );

  // === CONSEQUENCES ===
  doc.moveDown(0.5);
  doc.text(
    "À défaut de règlement dans le délai imparti, je me réserve le droit d'engager toute action judiciaire aux fins de recouvrement des sommes dues, majorées des intérêts de retard et des frais de procédure.",
  );

  // === CLOSING ===
  doc.moveDown(1);
  doc.text('Veuillez agréer, Madame, Monsieur, mes salutations distinguées.');

  // === SIGNATURE ===
  doc.moveDown(2);
  doc.font('Helvetica-Bold').text(data.entityName, margin + contentWidth / 2, doc.y, {
    width: contentWidth / 2,
    align: 'right',
  });
}
