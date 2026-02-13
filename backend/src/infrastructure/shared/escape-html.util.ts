const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const ESCAPE_REGEX = /[&<>"']/g;

export function escapeHtml(value: string): string {
  return value.replace(ESCAPE_REGEX, (char) => ESCAPE_MAP[char]);
}
