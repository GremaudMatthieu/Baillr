import { formatEuroCents } from '../../document/format-euro.util.js';
import { escapeHtml } from '../../shared/escape-html.util.js';

export interface ChargeRegularizationEmailData {
  entityName: string;
  tenantName: string;
  fiscalYear: number;
  totalShareCents: number;
  totalProvisionsPaidCents: number;
  balanceCents: number;
}

export function renderChargeRegularizationEmailHtml(
  data: ChargeRegularizationEmailData,
): string {
  const entityName = escapeHtml(data.entityName);
  const tenantName = escapeHtml(data.tenantName);
  const totalShare = escapeHtml(formatEuroCents(data.totalShareCents));
  const totalProvisions = escapeHtml(
    formatEuroCents(data.totalProvisionsPaidCents),
  );
  const balance = escapeHtml(formatEuroCents(Math.abs(data.balanceCents)));

  const balanceLabel =
    data.balanceCents > 0
      ? `un complément de ${balance} reste à votre charge`
      : data.balanceCents < 0
        ? `un trop-perçu de ${balance} vous sera restitué`
        : 'le solde est nul, aucun ajustement n\'est nécessaire';

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333; line-height: 1.6; margin: 0; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto;">
<p>Madame, Monsieur,</p>
<p>Veuillez trouver ci-joint le décompte de régularisation des charges pour l'année ${data.fiscalYear}.</p>
<p><strong>Total des charges locataires : ${totalShare}</strong></p>
<p>Provisions versées : ${totalProvisions}</p>
<p>Après régularisation, ${balanceLabel}.</p>
<p>Cordialement,<br>${entityName}</p>
<hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
<p style="font-size: 11px; color: #888;">Ce décompte est établi conformément à l'article 23 de la loi n° 89-462 du 6 juillet 1989. Les charges locatives sont régularisées annuellement par comparaison entre les provisions versées et les dépenses réellement engagées.</p>
</div>
</body>
</html>`;
}
