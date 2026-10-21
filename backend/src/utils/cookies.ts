import { randomBytes, timingSafeEqual } from 'node:crypto';

import type { Request, Response } from 'express';

import { env } from '../config/env.js';
import { duracaoParaMs } from './duration.js';

export const AUTH_COOKIE = 'sl_token';
export const REFRESH_COOKIE = 'sl_refresh';
export const MFA_COOKIE = 'sl_mfa';
export const CSRF_COOKIE = 'sl_csrf';
export const CSRF_HEADER = 'x-csrf-token';

const ACCESS_MAX_AGE_MS = duracaoParaMs(env.jwt.accessExpiresIn);
const REFRESH_MAX_AGE_MS = duracaoParaMs(env.jwt.refreshExpiresIn);
const CSRF_MAX_AGE_MS = REFRESH_MAX_AGE_MS;
const MFA_MAX_AGE_MS = 10 * 60 * 1000;

const baseCookie = {
  sameSite: 'lax' as const,
  secure: env.isProduction,
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

export function definirCookiesSessao(
  res: Response,
  accessToken: string,
  refreshToken: string,
): string {
  const csrfToken = randomBytes(24).toString('hex');
  res.cookie(AUTH_COOKIE, accessToken, {
    ...baseCookie,
    path: '/',
    httpOnly: true,
    maxAge: ACCESS_MAX_AGE_MS,
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseCookie,
    path: '/api/auth',
    httpOnly: true,
    maxAge: REFRESH_MAX_AGE_MS,
  });
  res.cookie(CSRF_COOKIE, csrfToken, {
    ...baseCookie,
    path: '/',
    httpOnly: false,
    maxAge: CSRF_MAX_AGE_MS,
  });
  return csrfToken;
}

export function definirCookieDesafioMfa(res: Response, token: string): void {
  res.cookie(MFA_COOKIE, token, {
    ...baseCookie,
    path: '/api/auth',
    httpOnly: true,
    maxAge: MFA_MAX_AGE_MS,
  });
}

export function limparCookieDesafioMfa(res: Response): void {
  res.clearCookie(MFA_COOKIE, {
    ...baseCookie,
    path: '/api/auth',
    httpOnly: true,
  });
}

export function limparCookiesSessao(res: Response): void {
  res.clearCookie(AUTH_COOKIE, { ...baseCookie, path: '/', httpOnly: true });
  res.clearCookie(REFRESH_COOKIE, {
    ...baseCookie,
    path: '/api/auth',
    httpOnly: true,
  });
  res.clearCookie(CSRF_COOKIE, { ...baseCookie, path: '/', httpOnly: false });
  res.clearCookie(MFA_COOKIE, {
    ...baseCookie,
    path: '/api/auth',
    httpOnly: true,
  });
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
