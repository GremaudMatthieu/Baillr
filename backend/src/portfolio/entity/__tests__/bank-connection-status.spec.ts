import { BankConnectionStatus } from '../bank-connection-status';

describe('BankConnectionStatus', () => {
  it('should create a linked status', () => {
    const status = BankConnectionStatus.linked();
    expect(status.value).toBe('linked');
    expect(status.isLinked).toBe(true);
    expect(status.isExpired).toBe(false);
  });

  it('should create an expired status', () => {
    const status = BankConnectionStatus.expired();
    expect(status.value).toBe('expired');
    expect(status.isLinked).toBe(false);
    expect(status.isExpired).toBe(true);
  });

  it('should create a disconnected status', () => {
    const status = BankConnectionStatus.disconnected();
    expect(status.value).toBe('disconnected');
    expect(status.isLinked).toBe(false);
  });

  it('should parse from string', () => {
    const status = BankConnectionStatus.fromString('linked');
    expect(status.value).toBe('linked');
  });

  it.each(['linked', 'expired', 'suspended', 'disconnected'])('should accept "%s"', (value) => {
    expect(BankConnectionStatus.fromString(value).value).toBe(value);
  });

  it('should throw on invalid status', () => {
    expect(() => BankConnectionStatus.fromString('invalid')).toThrow(
      'Invalid bank connection status: invalid',
    );
  });

  it('should compare equality', () => {
    const a = BankConnectionStatus.linked();
    const b = BankConnectionStatus.linked();
    const c = BankConnectionStatus.expired();
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
