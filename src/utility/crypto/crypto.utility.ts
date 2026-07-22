import * as crypto from 'crypto';

const getSecretKey = (): Buffer => {
  const secret = process.env.CRYPTO_SECRET_KEY || 'Q9UsQUzSSHyEVA03jFIT_32byte_secret!';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypts data into an AES-256-GCM ciphertext string (IV:AuthTag:Ciphertext).
 */
export function encryptPayload(data: unknown): string {
  if (data === undefined || data === null) return '';
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getSecretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(jsonString, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts an AES-256-GCM ciphertext string back into original object or string.
 */
export function decryptPayload<T = any>(ciphertext: string): T {
  if (!ciphertext || typeof ciphertext !== 'string') return ciphertext as unknown as T;
  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      // Fallback for plaintext or unencrypted legacy data
      try {
        return JSON.parse(ciphertext) as T;
      } catch {
        return ciphertext as unknown as T;
      }
    }
    const [ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getSecretKey(), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    const decryptedString = decrypted.toString('utf8');
    try {
      return JSON.parse(decryptedString) as T;
    } catch {
      return decryptedString as unknown as T;
    }
  } catch {
    return ciphertext as unknown as T;
  }
}
