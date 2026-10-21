import { describe, expect, it } from 'vitest';

import { PERMISSIONS } from '../../src/domain/permissions.js';
import type { Usuario } from '../../src/models/usuario.js';
import { exigeMfa, precisaVerificarMfa } from '../../src/services/mfa.service.js';

function usuario(mfaAtivo: boolean): Usuario {
  return { mfaAtivo } as Usuario;
}

describe('obrigatoriedade de MFA', () => {
  it('exige MFA quando há permissão administrativa', () => {
    for (const permissao of [
      PERMISSIONS.USUARIOS_CREATE,
      PERMISSIONS.USUARIOS_UPDATE,
      PERMISSIONS.USUARIOS_DEACTIVATE,
      PERMISSIONS.ROLES_MANAGE,
      PERMISSIONS.PERMISSIONS_MANAGE,
    ]) {
      expect(exigeMfa(new Set([permissao]))).toBe(true);
    }
  });

  it('não exige MFA para permissões operacionais', () => {
    expect(exigeMfa(new Set([PERMISSIONS.PROCESSOS_READ]))).toBe(false);
    expect(exigeMfa(new Set())).toBe(false);
  });

  it('exige verificação quando o usuário já ativou MFA', () => {
    expect(precisaVerificarMfa(usuario(true), new Set())).toBe(true);
    expect(precisaVerificarMfa(usuario(false), new Set())).toBe(false);
    expect(
      precisaVerificarMfa(
        usuario(false),
        new Set([PERMISSIONS.USUARIOS_UPDATE]),
      ),
    ).toBe(true);
  });
});
