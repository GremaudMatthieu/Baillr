import { createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

/**
 * Generate AES-256-CBC signature for AR24 API authentication.
 * The signature is produced by encrypting the date string with the private key.
 */
export function generateAr24Signature(
  privateKey: string,
  date: string,
): string {
  const key = normalizeKey(privateKey);
  const iv = deriveIv(date);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(date, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

/**
 * Decrypt AES-256-CBC encrypted response body from AR24 API.
 * AR24 encrypts successful responses; error responses are NOT encrypted.
 */
export function decryptAr24Response(
  privateKey: string,
  encryptedData: string,
): string {
  const key = normalizeKey(privateKey);
  // AR24 prepends the IV (16 bytes, base64-encoded) to the encrypted payload
  const raw = Buffer.from(encryptedData, 'base64');
  const iv = raw.subarray(0, IV_LENGTH);
  const encrypted = raw.subarray(IV_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Format a Date as the AR24-required date string: "YYYY-MM-DD HH:mm:ss"
 * AR24 expects Paris timezone (UTC+1/UTC+2 CET/CEST).
 */
export function formatAr24Date(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  // sv-SE produces "YYYY-MM-DD HH:mm:ss" natively
  return formatter.format(date);
}

/**
 * Normalize the private key to exactly 32 bytes for AES-256.
 * If the key is hex-encoded (64 chars), decode it.
 * Otherwise, pad or truncate to 32 bytes.
 */
function normalizeKey(privateKey: string): Buffer {
  if (privateKey.length === KEY_LENGTH * 2 && /^[0-9a-fA-F]+$/.test(privateKey)) {
    return Buffer.from(privateKey, 'hex');
  }
  const keyBuffer = Buffer.from(privateKey, 'utf8');
  if (keyBuffer.length >= KEY_LENGTH) {
    return keyBuffer.subarray(0, KEY_LENGTH);
  }
  // Pad with zeros if too short
  const padded = Buffer.alloc(KEY_LENGTH, 0);
  keyBuffer.copy(padded);
  return padded;
}

/**
 * Derive IV from the date string (AR24 uses date-based IV derivation).
 * Pads or truncates the date to exactly 16 bytes.
 */
function deriveIv(date: string): Buffer {
  const dateBuffer = Buffer.from(date, 'utf8');
  if (dateBuffer.length >= IV_LENGTH) {
    return dateBuffer.subarray(0, IV_LENGTH);
  }
  const iv = Buffer.alloc(IV_LENGTH, 0);
  dateBuffer.copy(iv);
  return iv;
}

