import { describe, expect, it } from 'vitest';

import { PERMISSIONS } from '../../src/domain/permissions.js';
import {
  possuiAlgumaPermissao,
  possuiPermissao,
  resolverPapelPrincipalId,
  type SujeitoAutorizavel,
} from '../../src/domain/rbac.js';

function sujeito(
  permissoes: string[],
  ativo = true,
): SujeitoAutorizavel {
  return {
    usuarioId: 1,
    ativo,
    permissoes: new Set(permissoes),
  };
}

describe('política RBAC', () => {
  it('nega por padrão quando não há permissão', () => {
    const usuario = sujeito([]);
    expect(possuiPermissao(usuario, PERMISSIONS.PROCESSOS_READ)).toBe(false);
  });

  it('concede quando a permissão está presente', () => {
    const usuario = sujeito([PERMISSIONS.PROCESSOS_READ]);
    expect(possuiPermissao(usuario, PERMISSIONS.PROCESSOS_READ)).toBe(true);
    expect(possuiPermissao(usuario, PERMISSIONS.PROCESSOS_CREATE)).toBe(false);
  });

  it('nega para usuário inativo mesmo com permissão', () => {
    const usuario = sujeito([PERMISSIONS.PROCESSOS_READ], false);
    expect(possuiPermissao(usuario, PERMISSIONS.PROCESSOS_READ)).toBe(false);
  });

  it('verifica qualquer permissão da lista', () => {
    const usuario = sujeito([PERMISSIONS.FLUXOS_READ]);
    expect(
      possuiAlgumaPermissao(usuario, [
        PERMISSIONS.PROCESSOS_READ,
        PERMISSIONS.FLUXOS_READ,
      ]),
    ).toBe(true);
    expect(
      possuiAlgumaPermissao(usuario, [PERMISSIONS.PROCESSOS_READ]),
    ).toBe(false);
  });

  it('nega controles de etapa sem permissão específica', () => {
    const usuario = sujeito([PERMISSIONS.PROCESSOS_ADVANCE]);
    expect(possuiPermissao(usuario, PERMISSIONS.PROCESSOS_BLOCK)).toBe(false);
    expect(possuiPermissao(usuario, PERMISSIONS.PROCESSOS_UNBLOCK)).toBe(false);
    expect(possuiPermissao(usuario, PERMISSIONS.PROCESSOS_SKIP)).toBe(false);
  });
});

describe('papel principal', () => {
  it('preserva o principal atual quando ele continua selecionado', () => {
    expect(resolverPapelPrincipalId([1, 2], undefined, 2)).toBe(2);
  });

  it('usa o primeiro papel quando o principal atual é removido', () => {
    expect(resolverPapelPrincipalId([1, 2], undefined, 3)).toBe(1);
  });

  it('respeita o principal solicitado explicitamente', () => {
    expect(resolverPapelPrincipalId([1, 2], 2, 1)).toBe(2);
  });

  it('não define principal quando não há papéis', () => {
    expect(resolverPapelPrincipalId([], undefined, 1)).toBeNull();
  });
});
