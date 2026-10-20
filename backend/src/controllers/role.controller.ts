import type { Request, Response } from 'express';

import {
  atualizarRoleSchema,
  definirPermissoesSchema,
  idParamSchema,
} from '../schemas/index.js';
import * as roleService from '../services/role.service.js';
import { contextoDe } from '../utils/contexto.js';
import { responderOk } from '../utils/http.js';
import { validar } from '../utils/validation.js';

export async function listar(_req: Request, res: Response): Promise<void> {
  responderOk(res, await roleService.listar());
}

export async function buscar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(res, await roleService.buscarPorId(id));
}

export async function listarPermissoes(
  _req: Request,
  res: Response,
): Promise<void> {
  responderOk(res, await roleService.listarPermissoes());
}

export async function definirPermissoes(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const { permissionIds } = validar(definirPermissoesSchema, req.body);
  responderOk(
    res,
    await roleService.definirPermissoes(
      id,
      permissionIds,
      contextoDe(req, res),
    ),
  );
}

export async function atualizar(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const dados = validar(atualizarRoleSchema, req.body);
  responderOk(res, await roleService.atualizar(id, dados, contextoDe(req, res)));
}
