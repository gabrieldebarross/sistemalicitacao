import type { Request, Response } from 'express';

import { relatorioResumoQuerySchema } from '../schemas/index.js';
import * as relatorioService from '../services/relatorio.service.js';
import { responderOk } from '../utils/http.js';
import { validar } from '../utils/validation.js';

export async function resumo(req: Request, res: Response): Promise<void> {
  const {
    tipoProcessoId,
    setorId,
    status,
    desde,
    ate,
    diasSemMovimentacao,
  } = validar(relatorioResumoQuerySchema, req.query);
  responderOk(
    res,
    await relatorioService.resumo(
      { tipoProcessoId, setorId, status, desde, ate },
      diasSemMovimentacao,
    ),
  );
}
