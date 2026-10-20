import { randomBytes, timingSafeEqual } from 'node:crypto';

import type { Request, Response } from 'express';

import { env } from '../config/env.js';

export const AUTH_COOKIE = 'sl_token';
export const CSRF_COOKIE = 'sl_csrf';
export const CSRF_HEADER = 'x-csrf-token';

const AUTH_MAX_AGE_MS = 1000 * 60 * 60 * 8; // 8 horas
const CSRF_MAX_AGE_MS = AUTH_MAX_AGE_MS;

const baseCookie = {
  sameSite: 'lax' as const,
  secure: env.isProduction,
  path: '/',
};

function parseCookies(header: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!header) {
    return result;
  }
  for (const parte of header.split(';')) {
    const idx = parte.indexOf('=');
    if (idx === -1) {
      continue;
    }
    const chave = parte.slice(0, idx).trim();
    const valor = parte.slice(idx + 1).trim();
    if (chave) {
      result[chave] = decodeURIComponent(valor);
    }
  }
  return result;
}

export function getCookie(req: Request, nome: string): string | undefined {
  return parseCookies(req.headers.cookie)[nome];
}

export function definirCookiesSessao(res: Response, token: string): string {
  const csrfToken = randomBytes(24).toString('hex');
  res.cookie(AUTH_COOKIE, token, {
    ...baseCookie,
    httpOnly: true,
    maxAge: AUTH_MAX_AGE_MS,
  });
  res.cookie(CSRF_COOKIE, csrfToken, {
    ...baseCookie,
    httpOnly: false,
    maxAge: CSRF_MAX_AGE_MS,
  });
  return csrfToken;
}

export function limparCookiesSessao(res: Response): void {
  res.clearCookie(AUTH_COOKIE, { ...baseCookie, httpOnly: true });
  res.clearCookie(CSRF_COOKIE, { ...baseCookie, httpOnly: false });
}

/**
 * Double-submit cookie: o cliente deve enviar o valor do cookie CSRF no header
 * em requisições que alteram estado.
 */
export function csrfValido(req: Request): boolean {
  const cookie = getCookie(req, CSRF_COOKIE);
  const header = req.header(CSRF_HEADER);
  if (!cookie || !header || cookie.length !== header.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(cookie), Buffer.from(header));
}
