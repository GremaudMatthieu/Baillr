import { sanitizeForFilename } from '../sanitize-filename.util';

describe('sanitizeForFilename', () => {
  it('should replace backslashes', () => {
    expect(sanitizeForFilename('path\\to\\file')).toBe('path_to_file');
  });

  it('should replace forward slashes', () => {
    expect(sanitizeForFilename('path/to/file')).toBe('path_to_file');
  });

  it('should replace double quotes', () => {
    expect(sanitizeForFilename('"quoted"')).toBe('_quoted_');
  });

  it('should replace colons', () => {
    expect(sanitizeForFilename('file:name')).toBe('file_name');
  });

  it('should replace asterisks', () => {
    expect(sanitizeForFilename('file*name')).toBe('file_name');
  });

  it('should replace question marks', () => {
    expect(sanitizeForFilename('file?name')).toBe('file_name');
  });

  it('should replace angle brackets', () => {
    expect(sanitizeForFilename('<file>')).toBe('_file_');
  });

  it('should replace pipe characters', () => {
    expect(sanitizeForFilename('file|name')).toBe('file_name');
  });

  it('should replace newlines and carriage returns', () => {
    expect(sanitizeForFilename('file\nname\r')).toBe('file_name_');
  });

  it('should handle multiple unsafe characters', () => {
    expect(sanitizeForFilename('a<b>c"d\\e')).toBe('a_b_c_d_e');
  });

  it('should replace spaces', () => {
    expect(sanitizeForFilename('ACME Corp')).toBe('ACME_Corp');
  });

  it('should return safe strings unchanged', () => {
    expect(sanitizeForFilename('Dupont')).toBe('Dupont');
  });
});
