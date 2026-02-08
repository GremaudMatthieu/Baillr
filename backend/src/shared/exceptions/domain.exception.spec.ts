import { DomainException } from './domain.exception';

describe('DomainException', () => {
  it('should create with message, code, and default status 400', () => {
    const exception = new DomainException('Tenant not found', 'TENANT_NOT_FOUND');
    expect(exception.message).toBe('Tenant not found');
    expect(exception.code).toBe('TENANT_NOT_FOUND');
    expect(exception.statusCode).toBe(400);
    expect(exception.name).toBe('DomainException');
  });

  it('should accept custom statusCode', () => {
    const exception = new DomainException('Forbidden', 'ACCESS_DENIED', 403);
    expect(exception.statusCode).toBe(403);
  });

  it('should extend Error', () => {
    const exception = new DomainException('Test', 'TEST');
    expect(exception).toBeInstanceOf(Error);
  });
});
