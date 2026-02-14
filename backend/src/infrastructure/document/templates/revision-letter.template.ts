import type { RevisionLetterPdfData } from '../revision-letter-pdf-data.interface.js';
import { formatEuroCents } from '../format-euro.util.js';
import { A4_PAGE_WIDTH, DEFAULT_MARGIN } from './pdf-constants.js';

export function renderRevisionLetterPdf(
  doc: PDFKit.PDFDocument,
  data: RevisionLetterPdfData,
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
  const tenantDisplayName =
    data.tenantCompanyName ?? `${data.tenantFirstName} ${data.tenantLastName}`;
  doc.fontSize(10).font('Helvetica');
  doc.text(tenantDisplayName, margin + contentWidth / 2, recipientY, {
    width: contentWidth / 2,
    align: 'right',
  });
  doc.text(data.tenantAddress, {
    width: contentWidth / 2,
    align: 'right',
  });

  // === DATE AND CITY ===
  const dateY = Math.max(doc.y, margin + 100) + 10;
  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Fait à ${data.city}, le ${data.documentDate}`, margin, dateY, {
      width: contentWidth,
      align: 'right',
    });

  // === TITLE ===
  doc.moveDown(2);
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('AVIS DE RÉVISION DE LOYER', margin, doc.y, {
      width: contentWidth,
      align: 'center',
    });

  // === OBJECT LINE ===
  doc.moveDown(1);
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Objet : ', margin, doc.y, { continued: true });
  doc.font('Helvetica').text('Avis de révision de loyer');

  // === LEASE REFERENCE ===
  doc.moveDown(0.5);
  doc.text(`Bail débutant le : ${data.leaseStartDate}`);

  // === BODY ===
  doc.moveDown(1);
  doc.text('Madame, Monsieur,');
  doc.moveDown(0.5);
  doc.text(
    `Conformément aux stipulations de votre contrat de bail, je vous informe que le loyer est révisé à compter du ${data.effectiveDate}, selon les modalités suivantes :`,
  );

  // === FORMULA SECTION ===
  doc.moveDown(1);
  doc.font('Helvetica-Bold').text('Calcul de la révision :');
  doc.moveDown(0.5);
  doc.font('Helvetica');
  doc.text(`Indice de référence : ${data.revisionIndexType}`);
  doc.text(`Ancien indice (${data.baseIndexQuarter}) : ${data.baseIndexValue}`);
  doc.text(`Nouvel indice (${data.newIndexQuarter}) : ${data.newIndexValue}`);

  doc.moveDown(0.5);
  doc.text(`Loyer actuel : ${formatEuroCents(data.currentRentCents)}`);

  doc.moveDown(0.5);
  doc
    .font('Helvetica-Bold')
    .text(
      `Nouveau loyer = ${formatEuroCents(data.currentRentCents)} × (${data.newIndexValue} / ${data.baseIndexValue}) = ${formatEuroCents(data.newRentCents)}`,
    );

  doc.moveDown(0.5);
  doc
    .font('Helvetica')
    .text(
      `Variation : ${data.differenceCents >= 0 ? '+' : ''}${formatEuroCents(data.differenceCents)}`,
    );

  // === EFFECTIVE DATE ===
  doc.moveDown(1);
  doc
    .font('Helvetica-Bold')
    .text(
      `Le nouveau loyer prendra effet à compter du ${data.effectiveDate}.`,
    );

  // === LEGAL MENTION ===
  doc.moveDown(1);
  doc
    .font('Helvetica')
    .fontSize(9)
    .text(
      "Conformément à l'article 17-1 de la loi n° 89-462 du 6 juillet 1989, le bailleur peut réviser le loyer une fois par an à la date convenue entre les parties ou, à défaut, à la date anniversaire du bail.",
    );

  // === CLOSING ===
  doc.moveDown(1);
  doc
    .fontSize(10)
    .text(
      'Veuillez agréer, Madame, Monsieur, mes salutations distinguées.',
    );

  // === SIGNATURE ===
  doc.moveDown(2);
  doc.font('Helvetica-Bold').text(data.entityName, margin + contentWidth / 2, doc.y, {
    width: contentWidth / 2,
    align: 'right',
  });
}
