import type { NextFunction, Request, Response } from 'express';

import { possuiPermissao } from '../domain/rbac.js';
import type { PermissionCode } from '../domain/permissions.js';
import {
  AuthenticationError,
  AuthorizationError,
  PasswordChangeRequiredError,
} from '../errors/app-error.js';
import * as sessaoRepo from '../repositories/sessao.repository.js';
import * as usuarioRepo from '../repositories/usuario.repository.js';
import { AUTH_COOKIE, getCookie } from '../utils/cookies.js';
import { verificarAccessToken } from '../utils/jwt.js';

function tokenDoHeader(req: Request): string | undefined {
  const header = req.header('authorization');
  if (!header) {
    return undefined;
  }
  const [tipo, valor] = header.split(' ');
  if (tipo?.toLowerCase() !== 'bearer' || !valor) {
    return undefined;
  }
  return valor;
}

/** Autentica a requisição via cookie HttpOnly ou header Bearer. */
export async function autenticar(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = getCookie(req, AUTH_COOKIE) ?? tokenDoHeader(req);
    if (!token) {
      next(new AuthenticationError('Não autenticado.'));
      return;
    }
    const payload = verificarAccessToken(token);
    if (!payload) {
      next(new AuthenticationError('Sessão expirada ou inválida.'));
      return;
    }
    const sessao = await sessaoRepo.buscarAtivaPorId(payload.sid, new Date());
    if (!sessao || sessao.usuarioId !== payload.sub) {
      next(new AuthenticationError('Sessão expirada ou revogada.'));
      return;
    }
    const dados = await usuarioRepo.buscarParaAutenticacao(payload.sub);
    if (!dados || !dados.usuario.ativo) {
      next(new AuthenticationError('Sessão inválida.'));
      return;
    }
    req.autenticacao = {
      usuarioId: dados.usuario.id,
      nome: dados.usuario.nome,
      email: dados.usuario.email,
      senhaProvisoria: dados.usuario.senhaProvisoria,
      sessaoId: sessao.id,
      permissoes: dados.permissoes,
      roles: dados.roles,
    };
    next();
  } catch (erro) {
    next(erro);
  }
}

/**
 * Bloqueia o acesso aos recursos enquanto o usuário estiver com senha
 * provisória. Deve ser aplicado após `autenticar` e não é aplicado às rotas de
 * autenticação (login/me/alterar-senha), que permanecem acessíveis.
 */
export function exigirSenhaAlterada(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.autenticacao?.senhaProvisoria) {
    next(new PasswordChangeRequiredError());
    return;
  }
  next();
}

/** Exige uma permissão explícita. Nega por padrão. */
export function exigirPermissao(permissao: PermissionCode) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const auth = req.autenticacao;
    if (!auth) {
      next(new AuthenticationError('Não autenticado.'));
      return;
    }
    const sujeito = {
      usuarioId: auth.usuarioId,
      ativo: true,
      permissoes: auth.permissoes,
    };
    if (!possuiPermissao(sujeito, permissao)) {
      next(new AuthorizationError('Você não possui permissão para esta ação.'));
      return;
    }
    next();
  };
}

/**
 * Exige ao menos uma das permissões informadas. Útil quando duas permissões
 * habilitam o mesmo caso de uso por caminhos diferentes (ex.: gerenciar papéis
 * e gerenciar permissões).
 */
export function exigirAlgumaPermissao(permissoes: readonly PermissionCode[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const auth = req.autenticacao;
    if (!auth) {
      next(new AuthenticationError('Não autenticado.'));
      return;
    }
    const sujeito = {
      usuarioId: auth.usuarioId,
      ativo: true,
      permissoes: auth.permissoes,
    };
    const autorizado = permissoes.some((permissao) =>
      possuiPermissao(sujeito, permissao),
    );
    if (!autorizado) {
      next(new AuthorizationError('Você não possui permissão para esta ação.'));
      return;
    }
    next();
  };
}
