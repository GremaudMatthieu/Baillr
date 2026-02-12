import { RevisionIndexType } from '../revision-index-type.js';
import { DomainException } from '@shared/exceptions/domain.exception.js';

describe('RevisionIndexType', () => {
  it('should create IRL type', () => {
    const type = RevisionIndexType.fromString('IRL');
    expect(type.value).toBe('IRL');
  });

  it('should create ILC type', () => {
    const type = RevisionIndexType.fromString('ILC');
    expect(type.value).toBe('ILC');
  });

  it('should create ICC type', () => {
    const type = RevisionIndexType.fromString('ICC');
    expect(type.value).toBe('ICC');
  });

  it('should trim whitespace', () => {
    const type = RevisionIndexType.fromString('  IRL  ');
    expect(type.value).toBe('IRL');
  });

  it('should reject invalid type', () => {
    expect(() => RevisionIndexType.fromString('INVALID')).toThrow(DomainException);
  });

  it('should reject empty string', () => {
    expect(() => RevisionIndexType.fromString('')).toThrow(DomainException);
  });

  it('should reject lowercase', () => {
    expect(() => RevisionIndexType.fromString('irl')).toThrow(DomainException);
  });

  it('should support equality comparison', () => {
    const a = RevisionIndexType.fromString('IRL');
    const b = RevisionIndexType.fromString('IRL');
    const c = RevisionIndexType.fromString('ILC');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
