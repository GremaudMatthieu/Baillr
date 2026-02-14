import type { StakeholderLetterPdfData } from '../stakeholder-letter-pdf-data.interface.js';
import { formatEuroCents } from '../format-euro.util.js';
import { A4_PAGE_WIDTH, DEFAULT_MARGIN } from './pdf-constants.js';

const RECIPIENT_LABELS: Record<string, string> = {
  insurance: "Compagnie d'assurance",
  lawyer: 'Avocat',
  guarantor: 'Garant (caution)',
};

const BODY_TEXTS: Record<string, string> = {
  insurance:
    "Nous vous informons de la situation de défaut de paiement de notre locataire mentionné ci-dessus. En application du contrat d'assurance loyers impayés souscrit auprès de votre compagnie, nous vous prions de bien vouloir prendre en charge le sinistre dont les détails sont présentés ci-dessous.",
  lawyer:
    "Nous souhaitons engager une procédure de recouvrement à l'encontre de notre locataire mentionné ci-dessus. Nous vous prions de bien vouloir nous assister dans les démarches judiciaires nécessaires.",
  guarantor:
    "En application de la clause de cautionnement attachée au bail mentionné ci-dessous, nous vous informons que le locataire est en situation de défaut de paiement. Conformément à votre engagement de caution, nous vous demandons de procéder au règlement des sommes dues.",
};

export function renderStakeholderLetterPdf(
  doc: PDFKit.PDFDocument,
  data: StakeholderLetterPdfData,
): void {
  const pageWidth = A4_PAGE_WIDTH;
  const margin = DEFAULT_MARGIN;
  const contentWidth = pageWidth - margin * 2;

  const recipientLabel = RECIPIENT_LABELS[data.recipientType] ?? data.recipientType;

  // === HEADER: Entity info (top-left) ===
  doc.fontSize(16).font('Helvetica-Bold').text(data.entityName, margin, margin);
  doc.fontSize(10).font('Helvetica');
  doc.text(data.entityAddress);
  if (data.entitySiret) {
    doc.text(`SIRET : ${data.entitySiret}`);
  }

  // === RECIPIENT ===
  const recipientY = margin;
  doc.fontSize(10).font('Helvetica');
  doc.text(recipientLabel, margin + contentWidth / 2, recipientY, {
    width: contentWidth / 2,
    align: 'right',
  });

  // === DATE ===
  const dateY = Math.max(doc.y, margin + 80) + 10;
  doc.fontSize(10).font('Helvetica').text(`Fait le ${data.date}`, margin, dateY, {
    width: contentWidth,
    align: 'right',
  });

  // === TITLE ===
  doc.moveDown(2);
  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .text('SIGNALEMENT DE LOYERS IMPAYÉS', margin, doc.y, {
      width: contentWidth,
      align: 'center',
    });

  // === TENANT INFO ===
  doc.moveDown(1);
  doc.fontSize(10).font('Helvetica-Bold').text('Locataire concerné :', margin);
  doc.font('Helvetica');
  doc.text(data.tenantName);
  doc.text(data.tenantAddress);

  // === LEASE REFERENCE ===
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').text('Références du bail :', margin);
  doc.font('Helvetica');
  doc.text(`Bail débutant le : ${data.leaseReference}`);
  doc.text(`Lot : ${data.unitIdentifier}`);

  // === BODY ===
  doc.moveDown(1);
  doc.text('Madame, Monsieur,');
  doc.moveDown(0.5);
  doc.text(BODY_TEXTS[data.recipientType] ?? '');

  // === DEBT SUMMARY ===
  doc.moveDown(1);
  doc.font('Helvetica-Bold').text('Détail de la dette :', margin);
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
  doc.moveDown(1);
  doc.font('Helvetica-Bold').text('Historique des démarches :', margin);
  doc.font('Helvetica');
  if (data.tier1SentAt) {
    doc.text(`• Relance amiable envoyée le ${data.tier1SentAt}`);
  }
  if (data.tier2SentAt) {
    doc.text(`• Mise en demeure envoyée le ${data.tier2SentAt}`);
  }
  if (!data.tier1SentAt && !data.tier2SentAt) {
    doc.text('• Aucune démarche préalable enregistrée');
  }

  // === CLOSING ===
  doc.moveDown(1);
  doc.text(
    'Nous vous prions de bien vouloir prendre les dispositions nécessaires dans les meilleurs délais.',
  );
  doc.moveDown(0.5);
  doc.text('Veuillez agréer, Madame, Monsieur, nos salutations distinguées.');

  // === SIGNATURE ===
  doc.moveDown(2);
  doc.font('Helvetica-Bold').text(data.entityName, margin + contentWidth / 2, doc.y, {
    width: contentWidth / 2,
    align: 'right',
  });
}
