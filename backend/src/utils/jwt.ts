import { randomBytes } from 'node:crypto';

import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { logger } from './logger.js';

export interface AccessTokenPayload {
  sub: number;
  email: string;
  sid: string;
}

export interface DesafioMfaPayload {
  sub: number;
  sid: string;
  setup: boolean;
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
    expiresIn: env.jwt.accessExpiresIn as unknown as NonNullable<
      jwt.SignOptions['expiresIn']
    >,
  };
  return jwt.sign(
    { email: payload.email, sid: payload.sid },
    getSegredo(),
    options,
  );
}

/** Verifica e decodifica o access token. Retorna null quando inválido/expirado. */
export function verificarAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getSegredo());
    if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
      return null;
    }
    const sub = Number(decoded.sub);
    const sid =
      typeof (decoded as { sid?: unknown }).sid === 'string'
        ? (decoded as { sid: string }).sid
        : '';
    if (!Number.isInteger(sub) || sub <= 0 || !sid) {
      return null;
    }
    const email =
      typeof (decoded as { email?: unknown }).email === 'string'
        ? (decoded as { email: string }).email
        : '';
    return { sub, email, sid };
  } catch {
    return null;
  }
}

/** Desafio de curta duração usado entre senha e segundo fator. */
export function assinarDesafioMfa(payload: DesafioMfaPayload): string {
  return jwt.sign(
    { purpose: 'MFA', sid: payload.sid, setup: payload.setup },
    getSegredo(),
    { subject: String(payload.sub), expiresIn: '10m' },
  );
}

export function verificarDesafioMfa(
  token: string,
): DesafioMfaPayload | null {
  try {
    const decoded = jwt.verify(token, getSegredo());
    if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
      return null;
    }
    const sub = Number(decoded.sub);
    const sid =
      typeof (decoded as { sid?: unknown }).sid === 'string'
        ? (decoded as { sid: string }).sid
        : '';
    const purpose = (decoded as { purpose?: unknown }).purpose;
    const setup = (decoded as { setup?: unknown }).setup;
    if (
      !Number.isInteger(sub) ||
      sub <= 0 ||
      !sid ||
      purpose !== 'MFA' ||
      typeof setup !== 'boolean'
    ) {
      return null;
    }
    return { sub, sid, setup };
  } catch {
    return null;
  }
}
