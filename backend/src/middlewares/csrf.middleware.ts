import type { NextFunction, Request, Response } from 'express';

import { CsrfError } from '../errors/app-error.js';
import { csrfValido } from '../utils/cookies.js';

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Double-submit cookie para requisições que alteram estado. */
export function protegerCsrf(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (METODOS_SEGUROS.has(req.method)) {
    next();
    return;
  }
  if (!csrfValido(req)) {
    next(new CsrfError());
    return;
  }
  next();
}
