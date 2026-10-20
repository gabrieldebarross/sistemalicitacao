import { randomBytes } from 'node:crypto';

import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { logger } from './logger.js';

export interface AccessTokenPayload {
  sub: number;
  email: string;
}

let segredoEfemero: string | null = null;

/**
 * Segredo de assinatura. Em produção é obrigatório (validado em `env`). Em
 * desenvolvimento/teste, se ausente, gera um segredo efêmero em memória para
 * não persistir segredos no repositório.
 */
function getSegredo(): string {
  if (env.jwt.secret) {
    return env.jwt.secret;
  }
  if (segredoEfemero === null) {
    segredoEfemero = randomBytes(48).toString('hex');
    logger.warn('JWT_SECRET ausente; usando segredo efêmero de desenvolvimento.');
  }
  return segredoEfemero;
}

export function assinarAccessToken(payload: AccessTokenPayload): string {
  const options: jwt.SignOptions = {
    subject: String(payload.sub),
    expiresIn: env.jwt.expiresIn as unknown as NonNullable<
      jwt.SignOptions['expiresIn']
    >,
  };
  return jwt.sign({ email: payload.email }, getSegredo(), options);
}

/** Verifica e decodifica o token. Retorna null quando inválido/expirado. */
export function verificarAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getSegredo());
    if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
      return null;
    }
    const sub = Number(decoded.sub);
    if (!Number.isInteger(sub) || sub <= 0) {
      return null;
    }
    const email =
      typeof (decoded as { email?: unknown }).email === 'string'
        ? (decoded as { email: string }).email
        : '';
    return { sub, email };
  } catch {
    return null;
  }
}
