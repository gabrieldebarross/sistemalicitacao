import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/app-error.js';
import { logger } from '../utils/logger.js';

interface ErrorBody {
  sucesso: false;
  mensagem: string;
  codigo: string;
}

/**
 * Middleware global de erros. Traduz exceções para o formato de resposta padrão
 * sem expor stack traces, SQL ou detalhes internos.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = res.locals.requestId as string | undefined;

  if (res.headersSent) {
    return;
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('erro de aplicação', {
        requestId,
        codigo: err.codigo,
        nome: err.name,
      });
    }
    const body: ErrorBody = {
      sucesso: false,
      mensagem: err.message,
      codigo: err.codigo,
    };
    res.status(err.statusCode).json(body);
    return;
  }

  logger.error('erro inesperado', {
    requestId,
    nome: err instanceof Error ? err.name : typeof err,
  });

  const body: ErrorBody = {
    sucesso: false,
    mensagem: 'Erro interno do servidor.',
    codigo: 'ERRO_INTERNO',
  };
  res.status(500).json(body);
}
