import { renderChargeRegularizationEmailHtml } from '../templates/charge-regularization-email.template';

describe('renderChargeRegularizationEmailHtml', () => {
  const baseData = {
    entityName: 'SCI Test',
    tenantName: 'Jean Dupont',
    fiscalYear: 2025,
    totalShareCents: 120000,
    totalProvisionsPaidCents: 100000,
    balanceCents: 20000,
  };

  it('should render HTML with entity and tenant names', () => {
    const html = renderChargeRegularizationEmailHtml(baseData);

    expect(html).toContain('SCI Test');
    expect(html).toContain('2025');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('should show complement message for positive balance', () => {
    const html = renderChargeRegularizationEmailHtml({
      ...baseData,
      balanceCents: 20000,
    });

    expect(html).toContain('complément');
    expect(html).toContain('reste à votre charge');
  });

  it('should show refund message for negative balance', () => {
    const html = renderChargeRegularizationEmailHtml({
      ...baseData,
      balanceCents: -15000,
    });

    expect(html).toContain('trop-perçu');
    expect(html).toContain('vous sera restitué');
  });

  it('should show zero balance message', () => {
    const html = renderChargeRegularizationEmailHtml({
      ...baseData,
      balanceCents: 0,
    });

    expect(html).toContain('le solde est nul');
    expect(html).toContain('aucun ajustement');
  });

  it('should include legal mention', () => {
    const html = renderChargeRegularizationEmailHtml(baseData);

    expect(html).toContain('article 23');
    expect(html).toContain('loi n° 89-462');
  });

  it('should escape HTML in entity name', () => {
    const html = renderChargeRegularizationEmailHtml({
      ...baseData,
      entityName: 'SCI <script>alert("xss")</script>',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should use absolute value for balance display', () => {
    const html = renderChargeRegularizationEmailHtml({
      ...baseData,
      balanceCents: -15000,
    });

    // Should display positive amount even for negative balance
    expect(html).not.toContain('-150');
  });
});
