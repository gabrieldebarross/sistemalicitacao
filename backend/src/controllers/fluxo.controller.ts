import type { Request, Response } from 'express';

import {
  atualizarEtapaSchema,
  atualizarFaseSchema,
  atualizarFluxoSchema,
  clonarFluxoSchema,
  criarEtapaSchema,
  criarFaseSchema,
  criarFluxoSchema,
  idParamSchema,
  listarFluxoQuerySchema,
} from '../schemas/index.js';
import * as fluxoService from '../services/fluxo.service.js';
import { PERMISSIONS } from '../domain/permissions.js';
import { possuiPermissao } from '../domain/rbac.js';
import { AuthorizationError } from '../errors/app-error.js';
import { contextoDe } from '../utils/contexto.js';
import { responderOk, responderPaginado } from '../utils/http.js';
import { validar } from '../utils/validation.js';

/**
 * Atribuir usuário responsável a uma etapa é uma ação separada de editar o
 * fluxo (`fluxos.assign`). Sem essa permissão, o campo é ignorado na edição.
 */
function validarPermissaoAtribuicao(
  req: Request,
  responsavelUsuarioId?: number | null,
): void {
  if (responsavelUsuarioId === undefined) {
    return;
  }
  const auth = req.autenticacao;
  if (
    !auth ||
    !possuiPermissao(
      {
        usuarioId: auth.usuarioId,
        ativo: true,
        permissoes: auth.permissoes,
      },
      PERMISSIONS.FLUXOS_ASSIGN,
    )
  ) {
    throw new AuthorizationError(
      'Você não possui permissão para atribuir responsável a etapas.',
    );
  }
}

export async function listar(req: Request, res: Response): Promise<void> {
  const query = validar(listarFluxoQuerySchema, req.query);
  responderPaginado(res, await fluxoService.listar(query));
}

export async function detalhar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(res, await fluxoService.detalhar(id));
}

export async function criar(req: Request, res: Response): Promise<void> {
  const dados = validar(criarFluxoSchema, req.body);
  responderOk(res, await fluxoService.criar(dados, contextoDe(req, res)), 201);
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const dados = validar(atualizarFluxoSchema, req.body);
  responderOk(
    res,
    await fluxoService.atualizar(id, dados, contextoDe(req, res)),
  );
}

export async function publicar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(res, await fluxoService.publicar(id, contextoDe(req, res)));
}

export async function arquivar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(res, await fluxoService.arquivar(id, contextoDe(req, res)));
}

export async function clonar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const dados = validar(clonarFluxoSchema, req.body ?? {});
  responderOk(
    res,
    await fluxoService.clonar(id, dados, contextoDe(req, res)),
    201,
  );
}

export async function criarFase(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const dados = validar(criarFaseSchema, req.body);
  responderOk(
    res,
    await fluxoService.criarFase(id, dados, contextoDe(req, res)),
    201,
  );
}

export async function atualizarFase(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const dados = validar(atualizarFaseSchema, req.body);
  responderOk(
    res,
    await fluxoService.atualizarFase(id, dados, contextoDe(req, res)),
  );
}

export async function removerFase(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(res, await fluxoService.removerFase(id, contextoDe(req, res)));
}

export async function criarEtapa(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const dados = validar(criarEtapaSchema, req.body);
  validarPermissaoAtribuicao(req, dados.responsavelUsuarioId);
  responderOk(
    res,
    await fluxoService.criarEtapa(id, dados, contextoDe(req, res)),
    201,
  );
}

export async function atualizarEtapa(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const dados = validar(atualizarEtapaSchema, req.body);
  validarPermissaoAtribuicao(req, dados.responsavelUsuarioId);
  responderOk(
    res,
    await fluxoService.atualizarEtapa(id, dados, contextoDe(req, res)),
  );
}

export async function removerEtapa(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(res, await fluxoService.removerEtapa(id, contextoDe(req, res)));
}
