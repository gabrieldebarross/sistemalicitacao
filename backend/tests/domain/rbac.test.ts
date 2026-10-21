import { describe, expect, it } from 'vitest';

import { PERMISSIONS } from '../../src/domain/permissions.js';
import {
  possuiAlgumaPermissao,
  possuiPermissao,
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
