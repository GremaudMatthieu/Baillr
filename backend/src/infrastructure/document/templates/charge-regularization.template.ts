import type { ChargeRegularizationPdfData } from '../charge-regularization-pdf-data.interface.js';
import { formatEuroCents } from '../format-euro.util.js';
import { A4_PAGE_WIDTH, DEFAULT_MARGIN } from './pdf-constants.js';

export function renderChargeRegularizationPdf(
  doc: PDFKit.PDFDocument,
  data: ChargeRegularizationPdfData,
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
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('DÉCOMPTE DE RÉGULARISATION DES CHARGES', margin, titleY, {
      width: contentWidth,
      align: 'center',
    });

  // === SUBTITLE ===
  doc.moveDown(0.5);
  doc
    .fontSize(11)
    .font('Helvetica')
    .text(`Année fiscale : ${data.fiscalYear}`, {
      width: contentWidth,
      align: 'center',
    });

  // === REFERENCE ===
  doc.moveDown(1);
  doc.fontSize(10).font('Helvetica');
  doc.text(`Lot : ${data.unitIdentifier}`, margin);
  if (data.unitAddress) {
    doc.text(`Adresse : ${data.unitAddress}`);
  }
  doc.text(
    `Période d'occupation : du ${data.occupancyStart} au ${data.occupancyEnd} (${data.occupiedDays} jours sur ${data.daysInYear})`,
  );

  // === CHARGES TABLE ===
  doc.moveDown(1);
  const tableX = margin;
  const labelColWidth = contentWidth * 0.45;
  const totalColWidth = contentWidth * 0.2;
  const shareColWidth = contentWidth * 0.2;
  const noteColWidth = contentWidth * 0.15;

  // Table header
  const headerY = doc.y;
  doc.font('Helvetica-Bold').fontSize(9);
  doc.rect(tableX, headerY, contentWidth, 20).fill('#f0f0f0');
  doc.fill('#000000');
  doc.text('Catégorie de charge', tableX + 5, headerY + 5, {
    width: labelColWidth - 10,
  });
  doc.text('Charge totale', tableX + labelColWidth, headerY + 5, {
    width: totalColWidth,
    align: 'right',
  });
  doc.text('Part locataire', tableX + labelColWidth + totalColWidth, headerY + 5, {
    width: shareColWidth,
    align: 'right',
  });
  doc.text(
    'Note',
    tableX + labelColWidth + totalColWidth + shareColWidth,
    headerY + 5,
    { width: noteColWidth, align: 'right' },
  );

  // Table rows
  let rowY = headerY + 22;
  doc.font('Helvetica').fontSize(9);
  for (const charge of data.charges) {
    if (rowY > 700) {
      doc.addPage();
      rowY = margin;
    }

    const note = charge.isWaterByConsumption ? 'Conso.' : 'Prorata';

    doc.text(charge.label, tableX + 5, rowY, { width: labelColWidth - 10 });
    doc.text(formatEuroCents(charge.totalChargeCents), tableX + labelColWidth, rowY, {
      width: totalColWidth,
      align: 'right',
    });
    doc.text(
      formatEuroCents(charge.tenantShareCents),
      tableX + labelColWidth + totalColWidth,
      rowY,
      { width: shareColWidth, align: 'right' },
    );
    doc.text(
      note,
      tableX + labelColWidth + totalColWidth + shareColWidth,
      rowY,
      { width: noteColWidth, align: 'right' },
    );

    rowY += 18;
  }

  // === TOTAL LINE ===
  rowY += 5;
  doc
    .moveTo(tableX, rowY)
    .lineTo(tableX + contentWidth, rowY)
    .stroke();
  rowY += 8;

  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Total charges locataire', tableX + 5, rowY, {
    width: labelColWidth + totalColWidth - 10,
  });
  doc.text(
    formatEuroCents(data.totalShareCents),
    tableX + labelColWidth + totalColWidth,
    rowY,
    { width: shareColWidth, align: 'right' },
  );

  // === PROVISIONS ===
  rowY += 22;
  doc.font('Helvetica').fontSize(10);
  doc.text('Provisions versées pendant la période', tableX + 5, rowY, {
    width: labelColWidth + totalColWidth - 10,
  });
  doc.text(
    formatEuroCents(data.totalProvisionsPaidCents),
    tableX + labelColWidth + totalColWidth,
    rowY,
    { width: shareColWidth, align: 'right' },
  );

  // === BALANCE ===
  rowY += 25;
  doc
    .moveTo(tableX, rowY)
    .lineTo(tableX + contentWidth, rowY)
    .stroke();
  rowY += 10;

  const balanceLabel =
    data.balanceCents > 0
      ? 'Complément à régler par le locataire'
      : data.balanceCents < 0
        ? 'Trop-perçu à restituer au locataire'
        : 'Solde nul — aucun ajustement';

  doc.font('Helvetica-Bold').fontSize(11);
  doc.text(balanceLabel, tableX + 5, rowY, {
    width: labelColWidth + totalColWidth - 10,
  });
  doc.text(
    formatEuroCents(Math.abs(data.balanceCents)),
    tableX + labelColWidth + totalColWidth,
    rowY,
    { width: shareColWidth, align: 'right' },
  );

  // === LEGAL FOOTER ===
  const footerY = Math.max(doc.y + 40, 700);
  doc.fontSize(8).font('Helvetica').fillColor('#666666');
  doc.text(
    `Ce décompte est établi conformément à l'article 23 de la loi n° 89-462 du 6 juillet 1989. ` +
      `Les charges locatives sont régularisées annuellement par comparaison entre les provisions versées et les dépenses réellement engagées.`,
    margin,
    footerY,
    { width: contentWidth, align: 'center' },
  );
  doc.moveDown(0.5);
  doc.text(`Document établi le ${data.documentDate}`, {
    width: contentWidth,
    align: 'center',
  });
}
