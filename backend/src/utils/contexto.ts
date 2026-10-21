import type { Request, Response } from 'express';

import { AuthenticationError } from '../errors/app-error.js';
import type { ContextoRequisicao } from '../types/context.js';

/** Extrai o contexto de execução a partir da requisição autenticada. */
export function contextoDe(
  req: Request,
  res: Response,
): ContextoRequisicao {
  const auth = req.autenticacao;
  const requestId =
    typeof res.locals.requestId === 'string' ? res.locals.requestId : '';
  return {
    usuarioId: auth?.usuarioId ?? null,
    requestId,
    ip: req.ip ?? null,
    userAgent: req.header('user-agent') ?? null,
    permissoes: auth?.permissoes ?? new Set<string>(),
  };
}

export function usuarioAutenticado(req: Request): number {
  const id = req.autenticacao?.usuarioId;
  if (!id) {
    throw new AuthenticationError('Não autenticado.');
  }
  return id;
}
