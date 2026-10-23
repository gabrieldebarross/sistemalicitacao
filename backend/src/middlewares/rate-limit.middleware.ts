import type { NextFunction, Request, Response } from 'express';

import { RateLimitError } from '../errors/app-error.js';

interface Registro {
  contagem: number;
  expiraEm: number;
}

const JANELA_MS = 15 * 60 * 1000;
const MAX_FALHAS = 10;

const falhas = new Map<string, Registro>();

/**
 * Limita tentativas de autenticação malsucedidas por IP. Requisições
 * bem-sucedidas e respostas de validação não consomem o limite.
 */
export function limitarLogin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const chave = req.ip ?? 'desconhecido';
  const agora = Date.now();
  const registro = falhas.get(chave);

  if (registro && registro.expiraEm <= agora) {
    falhas.delete(chave);
  }

  const atual = falhas.get(chave);
  if (atual && atual.contagem >= MAX_FALHAS) {
    next(new RateLimitError());
    return;
  }

  // A contagem é anterior à requisição atual. O login usa esse valor apenas
  // para avisos genéricos, sem confirmar a existência da conta.
  res.locals.tentativasLoginIp = atual?.contagem ?? 0;

  res.on('finish', () => {
    if (res.statusCode !== 401) {
      return;
    }

    const momento = Date.now();
    const registroFinal = falhas.get(chave);
    if (!registroFinal || registroFinal.expiraEm <= momento) {
      falhas.set(chave, { contagem: 1, expiraEm: momento + JANELA_MS });
      return;
    }
    registroFinal.contagem += 1;
  });

  next();
}
