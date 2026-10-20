import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { PERMISSIONS } from '../../src/domain/permissions.js';
import {
  AuthenticationError,
  AuthorizationError,
} from '../../src/errors/app-error.js';
import { exigirAlgumaPermissao } from '../../src/middlewares/auth.middleware.js';

function requisicao(permissoes?: string[]): Request {
  return {
    autenticacao:
      permissoes === undefined
        ? undefined
        : {
            usuarioId: 1,
            nome: 'Servidor',
            email: 'servidor@instituicao.test',
            senhaProvisoria: false,
            permissoes: new Set(permissoes),
            roles: [],
          },
  } as unknown as Request;
}

function executar(permissoes?: string[]) {
  const next = vi.fn<NextFunction>();
  exigirAlgumaPermissao([
    PERMISSIONS.ROLES_MANAGE,
    PERMISSIONS.PERMISSIONS_MANAGE,
  ])(requisicao(permissoes), {} as Response, next);
  return next;
}

describe('exigirAlgumaPermissao', () => {
  it('libera quando o usuário possui a primeira permissão', () => {
    expect(executar([PERMISSIONS.ROLES_MANAGE])).toHaveBeenCalledWith();
  });

  it('libera quando o usuário possui uma das permissões alternativas', () => {
    expect(executar([PERMISSIONS.PERMISSIONS_MANAGE])).toHaveBeenCalledWith();
  });

  it('nega quando o usuário não possui nenhuma das permissões', () => {
    const next = executar([PERMISSIONS.PROCESSOS_READ]);
    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(AuthorizationError);
  });

  it('nega quando não há autenticação', () => {
    const next = executar(undefined);
    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(AuthenticationError);
  });
});
