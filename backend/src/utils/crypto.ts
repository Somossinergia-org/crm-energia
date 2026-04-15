import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// Cifrar texto (para contraseñas SMTP en BD)
export function encrypt(text: string): string {
  const key = crypto.scryptSync(env.ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Descifrar texto
export function decrypt(encryptedText: string): string {
  const key = crypto.scryptSync(env.ENCRYPTION_KEY, 'salt', 32);
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Generar token aleatorio
export function generateToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}
