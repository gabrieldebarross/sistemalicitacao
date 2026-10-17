import type { NextFunction, Request, Response } from 'express';

import { NotFoundError } from '../errors/app-error.js';

/**
 * Rota inexistente: delega ao error handler com um NotFoundError padronizado.
 */
export function notFoundHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(new NotFoundError('Recurso não encontrado.'));
}
