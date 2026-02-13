import { escapeHtml } from '../escape-html.util';

describe('escapeHtml', () => {
  it('should escape ampersand', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
  });

  it('should escape angle brackets', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    );
  });

  it('should escape double quotes', () => {
    expect(escapeHtml('a "quoted" value')).toBe('a &quot;quoted&quot; value');
  });

  it('should escape single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('should escape all special characters at once', () => {
    expect(escapeHtml('<b>"A & B\'s"</b>')).toBe(
      '&lt;b&gt;&quot;A &amp; B&#39;s&quot;&lt;/b&gt;',
    );
  });

  it('should return empty string unchanged', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should return safe strings unchanged', () => {
    expect(escapeHtml('SCI Example')).toBe('SCI Example');
  });
});
