import type { Request, Response } from 'express';

import {
  criarDelegacaoSchema,
  idParamSchema,
  listarDelegacaoQuerySchema,
} from '../schemas/index.js';
import * as delegacaoService from '../services/delegacao.service.js';
import { contextoDe, usuarioAutenticado } from '../utils/contexto.js';
import { responderOk, responderPaginado } from '../utils/http.js';
import { validar } from '../utils/validation.js';

export async function listar(req: Request, res: Response): Promise<void> {
  const query = validar(listarDelegacaoQuerySchema, req.query);
  responderPaginado(
    res,
    await delegacaoService.listar(usuarioAutenticado(req), query),
  );
}

export async function criar(req: Request, res: Response): Promise<void> {
  const dados = validar(criarDelegacaoSchema, req.body);
  responderOk(
    res,
    await delegacaoService.criar(
      usuarioAutenticado(req),
      dados,
      contextoDe(req, res),
    ),
    201,
  );
}

export async function cancelar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(
    res,
    await delegacaoService.cancelar(
      usuarioAutenticado(req),
      id,
      contextoDe(req, res),
    ),
  );
}
