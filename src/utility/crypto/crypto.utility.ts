import * as CryptoJS from 'crypto-js';

const getSecretKey = (): string => {
  return process.env.CRYPTO_SECRET_KEY || 'Q9UsQUzSSHyEVA03jFIT';
};

/**
 * Encrypts any JS object or string into an AES-256 ciphertext string.
 */
export function encryptPayload(data: unknown): string {
  if (data === undefined || data === null) return '';
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonString, getSecretKey()).toString();
}

/**
 * Decrypts an AES-256 ciphertext string back into its original JS object or string.
 */
export function decryptPayload<T = any>(ciphertext: string): T {
  if (!ciphertext || typeof ciphertext !== 'string') return ciphertext as unknown as T;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, getSecretKey());
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedString) return ciphertext as unknown as T;
    try {
      return JSON.parse(decryptedString) as T;
    } catch {
      return decryptedString as unknown as T;
    }
  } catch {
    return ciphertext as unknown as T;
  }
}
