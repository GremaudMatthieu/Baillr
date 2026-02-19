import { escapeHtml } from '../../shared/escape-html.util.js';

export interface AlertItem {
  description: string;
  suggestedAction: string;
  applicationLink: string;
}

export interface AlertEmailData {
  entityName: string;
  date: string;
  unpaidAlerts: AlertItem[];
  insuranceAlerts: AlertItem[];
  escalationAlerts: AlertItem[];
  appUrl: string;
}

function renderAlertSection(
  title: string,
  alerts: AlertItem[],
): string {
  if (alerts.length === 0) return '';

  const items = alerts
    .map(
      (alert) => `
      <li style="margin-bottom: 12px; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
        <p style="margin: 0 0 4px 0; font-weight: bold;">${escapeHtml(alert.description)}</p>
        <p style="margin: 0 0 4px 0; color: #666; font-size: 13px;">${escapeHtml(alert.suggestedAction)}</p>
        <a href="${escapeHtml(alert.applicationLink)}" style="color: #2563eb; font-size: 13px;">Voir le détail</a>
      </li>`,
    )
    .join('');

  return `
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 16px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 12px;">${escapeHtml(title)} (${alerts.length})</h2>
      <ul style="list-style: none; padding: 0; margin: 0;">${items}</ul>
    </div>`;
}

export function renderAlertEmailHtml(data: AlertEmailData): string {
  const entityName = escapeHtml(data.entityName);
  const date = escapeHtml(data.date);

  const sections = [
    renderAlertSection('Loyers impayés', data.unpaidAlerts),
    renderAlertSection('Assurances expirantes', data.insuranceAlerts),
    renderAlertSection('Relances impayés', data.escalationAlerts),
  ].join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333; line-height: 1.6; margin: 0; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto;">
<h1 style="font-size: 20px; color: #111;">Alertes pour ${entityName}</h1>
<p style="color: #666; margin-bottom: 24px;">Résumé du ${date}</p>
${sections}
<hr style="border: none; border-top: 1px solid #ccc; margin: 24px 0;">
<p style="font-size: 11px; color: #888;">Vous recevez cet email car les alertes sont activées pour ${entityName}. Gérez vos préférences dans les paramètres de l'entité.</p>
</div>
</body>
</html>`;
}
