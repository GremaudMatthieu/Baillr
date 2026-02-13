import { formatEuroCents } from '../../document/format-euro.util.js';
import { escapeHtml } from '../../shared/escape-html.util.js';

export interface RentCallEmailData {
  entityName: string;
  billingPeriod: string;
  totalAmountCents: number;
  dueDate: number;
}

export function renderRentCallEmailHtml(data: RentCallEmailData): string {
  const totalFormatted = escapeHtml(formatEuroCents(data.totalAmountCents));
  const entityName = escapeHtml(data.entityName);
  const billingPeriod = escapeHtml(data.billingPeriod);

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333; line-height: 1.6; margin: 0; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto;">
<p>Madame, Monsieur,</p>
<p>Veuillez trouver ci-joint votre avis d'échéance pour la période de ${billingPeriod}.</p>
<p style="font-size: 16px;"><strong>Montant total : ${totalFormatted}</strong></p>
<p>Date d'exigibilité : le ${data.dueDate} de chaque mois</p>
<p>Cordialement,<br>${entityName}</p>
<hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
<p style="font-size: 11px; color: #888;">Cet avis d'échéance est envoyé à titre gratuit conformément à l'article 21 de la loi n° 89-462 du 6 juillet 1989.</p>
</div>
</body>
</html>`;
}
