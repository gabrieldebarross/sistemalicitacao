import type { Request, Response } from 'express';

import {
  atualizarUsuarioSchema,
  criarUsuarioSchema,
  definirRolesSchema,
  definirSetoresSchema,
  desativarUsuarioSchema,
  idParamSchema,
  listarUsuarioQuerySchema,
  usuarioSessaoParamSchema,
} from '../schemas/index.js';
import * as sessaoService from '../services/sessao.service.js';
import * as usuarioService from '../services/usuario.service.js';
import { contextoDe } from '../utils/contexto.js';
import { responderOk, responderPaginado } from '../utils/http.js';
import { validar } from '../utils/validation.js';

export async function listar(req: Request, res: Response): Promise<void> {
  const query = validar(listarUsuarioQuerySchema, req.query);
  responderPaginado(res, await usuarioService.listar(query));
}

/** Lista enxuta de usuários ativos para seleção de responsáveis. */
export async function listarAtribuiveis(
  _req: Request,
  res: Response,
): Promise<void> {
  responderOk(res, await usuarioService.listarAtribuiveis());
}

export async function buscar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(res, await usuarioService.buscarPorId(id));
}

export async function criar(req: Request, res: Response): Promise<void> {
  const dados = validar(criarUsuarioSchema, req.body);
  responderOk(
    res,
    await usuarioService.criar(dados, contextoDe(req, res)),
    201,
  );
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const dados = validar(atualizarUsuarioSchema, req.body);
  responderOk(
    res,
    await usuarioService.atualizar(id, dados, contextoDe(req, res)),
  );
}

export async function definirRoles(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const { roleIds } = validar(definirRolesSchema, req.body);
  responderOk(
    res,
    await usuarioService.definirRoles(id, roleIds, contextoDe(req, res)),
  );
}

export async function definirSetores(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const dados = validar(definirSetoresSchema, req.body);
  responderOk(
    res,
    await usuarioService.definirSetores(id, dados, contextoDe(req, res)),
  );
}

export async function desativar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const { destinoUsuarioId } = validar(desativarUsuarioSchema, req.body ?? {});
  responderOk(
    res,
    await usuarioService.desativar(
      id,
      contextoDe(req, res),
      destinoUsuarioId,
    ),
  );
}

export async function desbloquear(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(
    res,
    await usuarioService.desbloquear(id, contextoDe(req, res)),
  );
}

export async function resetarMfa(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(
    res,
    await usuarioService.resetarMfa(id, contextoDe(req, res)),
  );
}

export async function listarSessoes(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(
    res,
    await sessaoService.listarSessoesAdmin(id, req.autenticacao?.sessaoId),
  );
}

export async function revogarSessao(
  req: Request,
  res: Response,
): Promise<void> {
  const { id, sessaoId } = validar(usuarioSessaoParamSchema, req.params);
  await sessaoService.revogarSessaoAdmin(id, sessaoId);
  responderOk(res, { mensagem: 'Sessão revogada.' });
}
