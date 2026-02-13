import {
  renderRentCallEmailHtml,
  type RentCallEmailData,
} from '../templates/rent-call-email.template';

describe('renderRentCallEmailHtml', () => {
  const baseData: RentCallEmailData = {
    entityName: 'SCI Example',
    billingPeriod: 'Février 2026',
    totalAmountCents: 87500,
    dueDate: 5,
  };

  it('should render all required fields', () => {
    const html = renderRentCallEmailHtml(baseData);

    expect(html).toContain('Février 2026');
    expect(html).toContain('SCI Example');
    expect(html).toContain('le 5 de chaque mois');
    expect(html).toContain("avis d'échéance");
    expect(html).toContain('article 21');
    expect(html).toContain('loi n° 89-462');
  });

  it('should format amounts in French currency style', () => {
    const html = renderRentCallEmailHtml(baseData);

    // 87500 cents = 875,00 € — Intl.NumberFormat produces various whitespace chars
    expect(html).toMatch(/875,00.{0,2}€/);
  });

  it('should escape HTML entities in user data to prevent XSS', () => {
    const xssData: RentCallEmailData = {
      ...baseData,
      entityName: '<script>alert(1)</script>',
      billingPeriod: '<img onerror=alert(1)>',
    };

    const html = renderRentCallEmailHtml(xssData);

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;img onerror=alert(1)&gt;');
    expect(html).not.toContain('<img onerror=alert(1)>');
  });

  it('should generate valid HTML', () => {
    const html = renderRentCallEmailHtml(baseData);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="fr">');
    expect(html).toContain('</html>');
    expect(html).toContain('<body');
    expect(html).toContain('</body>');
    // Inline styles (email-safe, no external CSS)
    expect(html).toContain('style=');
    expect(html).not.toContain('<style>');
    expect(html).not.toContain('<link');
  });
});
