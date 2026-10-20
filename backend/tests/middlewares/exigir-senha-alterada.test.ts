import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { PasswordChangeRequiredError } from '../../src/errors/app-error.js';
import { exigirSenhaAlterada } from '../../src/middlewares/auth.middleware.js';

function requisicao(senhaProvisoria: boolean | undefined): Request {
  return {
    autenticacao:
      senhaProvisoria === undefined
        ? undefined
        : {
            usuarioId: 1,
            nome: 'Servidor',
            email: 'servidor@instituicao.test',
            senhaProvisoria,
            permissoes: new Set<string>(),
            roles: [],
          },
  } as unknown as Request;
}

function executar(senhaProvisoria: boolean | undefined) {
  const next = vi.fn<NextFunction>();
  exigirSenhaAlterada(
    requisicao(senhaProvisoria),
    {} as Response,
    next,
  );
  return next;
}

describe('exigirSenhaAlterada', () => {
  it('bloqueia o acesso enquanto a senha for provisória', () => {
    const next = executar(true);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(PasswordChangeRequiredError);
  });

  it('libera quando a senha já foi alterada', () => {
    const next = executar(false);
    expect(next).toHaveBeenCalledWith();
  });

  it('não interfere quando não há autenticação', () => {
    const next = executar(undefined);
    expect(next).toHaveBeenCalledWith();
  });
});
