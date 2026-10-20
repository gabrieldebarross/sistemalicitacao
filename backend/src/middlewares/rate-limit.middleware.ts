import type { NextFunction, Request, Response } from 'express';

import { RateLimitError } from '../errors/app-error.js';

interface Registro {
  contagem: number;
  expiraEm: number;
}

const JANELA_MS = 15 * 60 * 1000;
const MAX_TENTATIVAS = 10;

const tentativas = new Map<string, Registro>();

/** Limita tentativas de login por IP (proteção básica contra brute force). */
export function limitarLogin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const chave = req.ip ?? 'desconhecido';
  const agora = Date.now();
  const registro = tentativas.get(chave);

  if (!registro || registro.expiraEm <= agora) {
    tentativas.set(chave, { contagem: 1, expiraEm: agora + JANELA_MS });
    next();
    return;
  }

  if (registro.contagem >= MAX_TENTATIVAS) {
    next(new RateLimitError());
    return;
  }

  registro.contagem += 1;
  next();
}
