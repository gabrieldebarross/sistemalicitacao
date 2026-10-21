import type { Request, Response } from 'express';

import {
  atualizarVisaoSchema,
  idParamSchema,
  salvarVisaoSchema,
} from '../schemas/index.js';
import * as visaoService from '../services/visao.service.js';
import { contextoDe, usuarioAutenticado } from '../utils/contexto.js';
import { responderOk } from '../utils/http.js';
import { validar } from '../utils/validation.js';

export async function listar(req: Request, res: Response): Promise<void> {
  responderOk(res, await visaoService.listar(usuarioAutenticado(req)));
}

export async function criar(req: Request, res: Response): Promise<void> {
  const dados = validar(salvarVisaoSchema, req.body);
  responderOk(
    res,
    await visaoService.criar(
      usuarioAutenticado(req),
      dados,
      contextoDe(req, res),
    ),
    201,
  );
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const dados = validar(atualizarVisaoSchema, req.body);
  responderOk(
    res,
    await visaoService.atualizar(
      usuarioAutenticado(req),
      id,
      dados,
      contextoDe(req, res),
    ),
  );
}

export async function remover(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  await visaoService.remover(
    usuarioAutenticado(req),
    id,
    contextoDe(req, res),
  );
  responderOk(res, { mensagem: 'Visão salva removida.' });
}
