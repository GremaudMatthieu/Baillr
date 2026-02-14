import { renderReminderEmailHtml } from '../reminder-email.template';

describe('renderReminderEmailHtml', () => {
  const baseData = {
    tenantName: 'Madame Dupont',
    amount: 85000,
    daysLate: 12,
    entityName: 'SCI Les Oliviers',
    entityIban: 'FR76 1234 5678 9012 3456 7890 123',
    entityBic: 'BNPAFRPP',
    period: 'Janvier 2026',
  };

  it('should render French reminder email HTML', () => {
    const html = renderReminderEmailHtml(baseData);

    expect(html).toContain('Madame Dupont');
    expect(html).toContain('Janvier 2026');
    expect(html).toContain('12 jours');
    expect(html).toContain('SCI Les Oliviers');
    expect(html).toContain('FR76 1234 5678 9012 3456 7890 123');
    expect(html).toContain('BNPAFRPP');
    expect(html).toContain('relance amiable');
  });

  it('should escape HTML special characters', () => {
    const html = renderReminderEmailHtml({
      ...baseData,
      tenantName: 'M. <script>alert("xss")</script>',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should use singular "jour" for 1 day late', () => {
    const html = renderReminderEmailHtml({
      ...baseData,
      daysLate: 1,
    });

    expect(html).toContain('1 jour');
    expect(html).not.toContain('1 jours');
  });

  it('should format amount as EUR currency', () => {
    const html = renderReminderEmailHtml(baseData);

    // 85000 cents = 850,00 € (Intl.NumberFormat fr-FR uses narrow no-break space)
    expect(html).toMatch(/850,00/);
  });
});
