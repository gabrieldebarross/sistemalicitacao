import type { Request, Response } from 'express';

import {
  atualizarCargoSchema,
  criarCargoSchema,
  idParamSchema,
  listarCargoQuerySchema,
} from '../schemas/index.js';
import * as cargoService from '../services/cargo.service.js';
import { contextoDe } from '../utils/contexto.js';
import { responderOk, responderPaginado } from '../utils/http.js';
import { validar } from '../utils/validation.js';

export async function listar(req: Request, res: Response): Promise<void> {
  const query = validar(listarCargoQuerySchema, req.query);
  const resultado = await cargoService.listar(query);
  responderPaginado(res, resultado);
}

export async function buscar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(res, await cargoService.buscarPorId(id));
}

export async function criar(req: Request, res: Response): Promise<void> {
  const dados = validar(criarCargoSchema, req.body);
  const cargo = await cargoService.criar(dados, contextoDe(req, res));
  responderOk(res, cargo, 201);
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const dados = validar(atualizarCargoSchema, req.body);
  const cargo = await cargoService.atualizar(id, dados, contextoDe(req, res));
  responderOk(res, cargo);
}
