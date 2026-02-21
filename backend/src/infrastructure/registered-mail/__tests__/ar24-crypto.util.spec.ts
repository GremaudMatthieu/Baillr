import {
  generateAr24Signature,
  decryptAr24Response,
  formatAr24Date,
} from '../ar24-crypto.util.js';
import { createCipheriv } from 'crypto';

describe('ar24-crypto.util', () => {
  const testKey = 'a'.repeat(64); // 64 hex chars → 32 bytes
  const testDate = '2026-02-21 14:30:00';

  describe('generateAr24Signature', () => {
    it('should produce a non-empty base64 string', () => {
      const signature = generateAr24Signature(testKey, testDate);

      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');
      // Should be valid base64
      expect(Buffer.from(signature, 'base64').toString('base64')).toBe(
        signature,
      );
    });

    it('should produce deterministic output for same inputs', () => {
      const sig1 = generateAr24Signature(testKey, testDate);
      const sig2 = generateAr24Signature(testKey, testDate);

      expect(sig1).toBe(sig2);
    });

    it('should produce different output for very different dates', () => {
      const sig1 = generateAr24Signature(testKey, '2026-02-21 14:30:00');
      const sig2 = generateAr24Signature(testKey, '2099-12-31 23:59:59');

      expect(sig1).not.toBe(sig2);
    });

    it('should produce different output for different keys', () => {
      const key1 = 'a'.repeat(64);
      const key2 = 'b'.repeat(64);
      const sig1 = generateAr24Signature(key1, testDate);
      const sig2 = generateAr24Signature(key2, testDate);

      expect(sig1).not.toBe(sig2);
    });

    it('should handle UTF-8 key that is shorter than 32 bytes', () => {
      const shortKey = 'short-key';
      const signature = generateAr24Signature(shortKey, testDate);

      expect(signature).toBeTruthy();
    });
  });

  describe('decryptAr24Response', () => {
    it('should decrypt data encrypted with known IV + key', () => {
      const key = Buffer.from(testKey, 'hex');
      const plaintext = JSON.stringify({ result: { id: '123' } });

      // Simulate AR24 encrypted response: IV (16 bytes) + encrypted data
      const iv = Buffer.alloc(16);
      iv.write('random-iv-bytes!');
      const cipher = createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // AR24 format: base64(IV + encrypted)
      const ar24Payload = Buffer.concat([iv, encrypted]).toString('base64');

      const result = decryptAr24Response(testKey, ar24Payload);

      expect(result).toBe(plaintext);
    });

    it('should throw on invalid encrypted data', () => {
      expect(() => {
        decryptAr24Response(testKey, 'not-valid-encrypted-data');
      }).toThrow();
    });
  });

  describe('formatAr24Date', () => {
    it('should return a string in YYYY-MM-DD HH:mm:ss format', () => {
      const date = new Date('2026-02-21T13:30:00Z');
      const formatted = formatAr24Date(date);

      // Should match pattern YYYY-MM-DD HH:mm:ss
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should use Paris timezone', () => {
      // 2026-02-21 13:00 UTC = 2026-02-21 14:00 CET (UTC+1, winter time)
      const date = new Date('2026-02-21T13:00:00Z');
      const formatted = formatAr24Date(date);

      expect(formatted).toBe('2026-02-21 14:00:00');
    });

    it('should use current date when no argument provided', () => {
      const result = formatAr24Date();

      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });
  });
});
