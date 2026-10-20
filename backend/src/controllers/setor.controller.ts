import type { Request, Response } from 'express';

import {
  atualizarSetorSchema,
  criarSetorSchema,
  idParamSchema,
  listarSetorQuerySchema,
} from '../schemas/index.js';
import * as setorService from '../services/setor.service.js';
import { contextoDe } from '../utils/contexto.js';
import { responderOk, responderPaginado } from '../utils/http.js';
import { validar } from '../utils/validation.js';

export async function listar(req: Request, res: Response): Promise<void> {
  const query = validar(listarSetorQuerySchema, req.query);
  responderPaginado(res, await setorService.listar(query));
}

export async function buscar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(res, await setorService.buscarPorId(id));
}

export async function criar(req: Request, res: Response): Promise<void> {
  const dados = validar(criarSetorSchema, req.body);
  responderOk(res, await setorService.criar(dados, contextoDe(req, res)), 201);
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const dados = validar(atualizarSetorSchema, req.body);
  responderOk(res, await setorService.atualizar(id, dados, contextoDe(req, res)));
}
