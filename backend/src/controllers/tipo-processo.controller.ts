import type { Request, Response } from 'express';

import {
  atualizarTipoProcessoSchema,
  criarTipoProcessoSchema,
  idParamSchema,
  listarTipoProcessoQuerySchema,
} from '../schemas/index.js';
import * as tipoService from '../services/tipo-processo.service.js';
import { contextoDe } from '../utils/contexto.js';
import { responderOk, responderPaginado } from '../utils/http.js';
import { validar } from '../utils/validation.js';

export async function listar(req: Request, res: Response): Promise<void> {
  const query = validar(listarTipoProcessoQuerySchema, req.query);
  responderPaginado(res, await tipoService.listar(query));
}

export async function buscar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(res, await tipoService.buscarPorId(id));
}

export async function criar(req: Request, res: Response): Promise<void> {
  const dados = validar(criarTipoProcessoSchema, req.body);
  responderOk(res, await tipoService.criar(dados, contextoDe(req, res)), 201);
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const dados = validar(atualizarTipoProcessoSchema, req.body);
  responderOk(
    res,
    await tipoService.atualizar(id, dados, contextoDe(req, res)),
  );
}
