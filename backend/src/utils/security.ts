import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

import { env } from '../config/env.js';

/** Hash determinístico para tokens e códigos de alta entropia. */
export function hashToken(valor: string): string {
  return createHash('sha256').update(valor).digest('hex');
}

export function gerarTokenAleatorio(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

function chaveMfa(): Buffer {
  const valor = env.mfa.encryptionKey;
  if (!valor) {
    throw new Error(
      'MFA_ENCRYPTION_KEY não configurada. Defina a variável para usar MFA.',
    );
  }
  const hex = /^[0-9a-f]{64}$/i.test(valor);
  const base64 = /^[A-Za-z0-9+/]{43}=?$/.test(valor);
  if (hex) {
    return Buffer.from(valor, 'hex');
  }
  if (base64) {
    return Buffer.from(valor, 'base64');
  }
  const utf8 = Buffer.from(valor, 'utf8');
  if (utf8.length === 32) {
    return utf8;
  }
  throw new Error(
    'MFA_ENCRYPTION_KEY inválida: use 32 bytes em hex, base64 ou texto.',
  );
}

/** AES-256-GCM: retorna iv.tag.ciphertext em base64. */
export function criptografarSegredo(segredo: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', chaveMfa(), iv);
  const encrypted = Buffer.concat([
    cipher.update(segredo, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((item) => item.toString('base64')).join('.');
}

export function descriptografarSegredo(valor: string): string {
  const [ivB64, tagB64, encryptedB64] = valor.split('.');
  if (!ivB64 || !tagB64 || !encryptedB64) {
    throw new Error('Segredo MFA inválido.');
  }
  const decipher = createDecipheriv(
    'aes-256-gcm',
    chaveMfa(),
    Buffer.from(ivB64, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
