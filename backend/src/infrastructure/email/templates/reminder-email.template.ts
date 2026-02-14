import { formatEuroCents } from '../../document/format-euro.util.js';
import { escapeHtml } from '../../shared/escape-html.util.js';

export interface ReminderEmailData {
  tenantName: string;
  amount: number;
  daysLate: number;
  entityName: string;
  entityIban: string;
  entityBic: string;
  period: string;
}

export function renderReminderEmailHtml(data: ReminderEmailData): string {
  const tenantName = escapeHtml(data.tenantName);
  const amount = escapeHtml(formatEuroCents(data.amount));
  const entityName = escapeHtml(data.entityName);
  const entityIban = escapeHtml(data.entityIban);
  const entityBic = escapeHtml(data.entityBic);
  const period = escapeHtml(data.period);

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333; line-height: 1.6; margin: 0; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto;">
<p>${tenantName},</p>
<p>Nous nous permettons de vous rappeler que votre loyer pour la période de <strong>${period}</strong> reste impayé à ce jour.</p>
<p style="font-size: 16px;"><strong>Montant dû : ${amount}</strong></p>
<p>Ce montant est en retard de <strong>${data.daysLate} jour${data.daysLate > 1 ? 's' : ''}</strong>.</p>
<p>Nous vous prions de bien vouloir procéder au règlement dans les meilleurs délais par virement bancaire aux coordonnées suivantes :</p>
<table style="border-collapse: collapse; margin: 10px 0;">
<tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">IBAN</td><td style="padding: 4px 0;">${entityIban}</td></tr>
<tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">BIC</td><td style="padding: 4px 0;">${entityBic}</td></tr>
</table>
<p>Si votre paiement a été effectué entre-temps, nous vous prions de ne pas tenir compte de ce rappel.</p>
<p>Cordialement,<br>${entityName}</p>
<hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
<p style="font-size: 11px; color: #888;">Ce courrier constitue une simple relance amiable et ne saurait constituer une mise en demeure au sens de l'article 1344 du Code civil.</p>
</div>
</body>
</html>`;
}
