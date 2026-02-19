import {
  renderAlertEmailHtml,
  type AlertEmailData,
} from '../alert-email.template';

describe('renderAlertEmailHtml', () => {
  const baseData: AlertEmailData = {
    entityName: 'SCI Dupont',
    date: '18/02/2026',
    appUrl: 'https://app.baillr.fr',
    unpaidAlerts: [],
    insuranceAlerts: [],
    escalationAlerts: [],
  };

  it('should render HTML with entity name and date', () => {
    const html = renderAlertEmailHtml(baseData);

    expect(html).toContain('Alertes pour SCI Dupont');
    expect(html).toContain('Résumé du 18/02/2026');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('should render unpaid alerts section', () => {
    const data: AlertEmailData = {
      ...baseData,
      unpaidAlerts: [
        {
          description: 'Loyer impayé — Jean Dupont — Apt A1 — 850,00 € — 2026-01',
          suggestedAction: 'Consultez le détail du loyer et envoyez un rappel',
          applicationLink: 'https://app.baillr.fr/rent-calls',
        },
      ],
    };

    const html = renderAlertEmailHtml(data);

    expect(html).toContain('Loyers impayés (1)');
    expect(html).toContain('Jean Dupont');
    expect(html).toContain('Apt A1');
    expect(html).toContain('Consultez le détail du loyer');
    expect(html).toContain('https://app.baillr.fr/rent-calls');
  });

  it('should render insurance alerts section', () => {
    const data: AlertEmailData = {
      ...baseData,
      insuranceAlerts: [
        {
          description: 'Assurance expirante — Marie Martin — expire le 25/02/2026',
          suggestedAction: 'Contactez le locataire pour renouveler son assurance',
          applicationLink: 'https://app.baillr.fr/tenants/abc',
        },
      ],
    };

    const html = renderAlertEmailHtml(data);

    expect(html).toContain('Assurances expirantes (1)');
    expect(html).toContain('Marie Martin');
    expect(html).toContain('expire le 25/02/2026');
  });

  it('should render escalation alerts section', () => {
    const data: AlertEmailData = {
      ...baseData,
      escalationAlerts: [
        {
          description: 'Seuil d\'escalade atteint — Paul Durand — Niveau 2 envoyé sans paiement',
          suggestedAction: 'Passez au niveau suivant de la procédure de recouvrement',
          applicationLink: 'https://app.baillr.fr/rent-calls',
        },
      ],
    };

    const html = renderAlertEmailHtml(data);

    expect(html).toContain('Relances impayés (1)');
    expect(html).toContain('Paul Durand');
    expect(html).toContain('Niveau 2');
  });

  it('should omit empty sections', () => {
    const html = renderAlertEmailHtml(baseData);

    expect(html).not.toContain('Loyers impayés');
    expect(html).not.toContain('Assurances expirantes');
    expect(html).not.toContain('Relances impayés');
  });

  it('should escape HTML entities in all interpolated strings', () => {
    const data: AlertEmailData = {
      ...baseData,
      entityName: '<script>alert("xss")</script>',
      unpaidAlerts: [
        {
          description: 'Loyer <b>impayé</b>',
          suggestedAction: 'Action & "quoted"',
          applicationLink: 'https://app.baillr.fr/rent-calls?id=1&type=unpaid',
        },
      ],
    };

    const html = renderAlertEmailHtml(data);

    expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(html).toContain('Loyer &lt;b&gt;impayé&lt;/b&gt;');
    expect(html).toContain('Action &amp; &quot;quoted&quot;');
    expect(html).not.toContain('<script>');
  });

  it('should NOT include sensitive data placeholders (NFR11)', () => {
    const html = renderAlertEmailHtml({
      ...baseData,
      unpaidAlerts: [
        {
          description: 'Loyer impayé — Jean — 850,00 €',
          suggestedAction: 'Consultez le détail',
          applicationLink: 'https://app.baillr.fr/rent-calls',
        },
      ],
    });

    // Template itself should never contain bank details patterns
    expect(html).not.toContain('IBAN');
    expect(html).not.toContain('BIC');
    expect(html).not.toContain('password');
    expect(html).not.toContain('mot de passe');
  });

  it('should include application link for each alert item', () => {
    const data: AlertEmailData = {
      ...baseData,
      unpaidAlerts: [
        {
          description: 'Alert 1',
          suggestedAction: 'Action 1',
          applicationLink: 'https://app.baillr.fr/rent-calls',
        },
      ],
      insuranceAlerts: [
        {
          description: 'Alert 2',
          suggestedAction: 'Action 2',
          applicationLink: 'https://app.baillr.fr/tenants/abc',
        },
      ],
    };

    const html = renderAlertEmailHtml(data);

    expect(html).toContain('href="https://app.baillr.fr/rent-calls"');
    expect(html).toContain('href="https://app.baillr.fr/tenants/abc"');
  });

  it('should include footer with preference management note', () => {
    const html = renderAlertEmailHtml(baseData);

    expect(html).toContain('alertes sont activées pour SCI Dupont');
    expect(html).toContain('préférences');
  });

  it('should render multiple alerts in the same section', () => {
    const data: AlertEmailData = {
      ...baseData,
      unpaidAlerts: [
        {
          description: 'Alert 1',
          suggestedAction: 'Action 1',
          applicationLink: 'https://app.baillr.fr/rent-calls',
        },
        {
          description: 'Alert 2',
          suggestedAction: 'Action 2',
          applicationLink: 'https://app.baillr.fr/rent-calls',
        },
      ],
    };

    const html = renderAlertEmailHtml(data);

    expect(html).toContain('Loyers impayés (2)');
    expect(html).toContain('Alert 1');
    expect(html).toContain('Alert 2');
  });
});
