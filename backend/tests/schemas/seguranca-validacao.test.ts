import { describe, expect, it } from 'vitest';

import { env } from '../../src/config/env.js';
import {
  alterarSenhaSchema,
  criarUsuarioSchema,
  definirRolesSchema,
  listarTarefaQuerySchema,
  mfaCodigoSchema,
  salvarVisaoSchema,
  sessaoIdParamSchema,
  usuarioSessaoParamSchema,
} from '../../src/schemas/index.js';

describe('política de senha', () => {
  it('exige no mínimo 8 caracteres', () => {
    expect(env.password.minLength).toBeGreaterThanOrEqual(8);
    expect(() =>
      criarUsuarioSchema.parse({
        nome: 'Fulano',
        email: 'fulano@exemplo.gov.br',
        senha: 'a'.repeat(7),
      }),
    ).toThrow();
    expect(
      criarUsuarioSchema.parse({
        nome: 'Fulano',
        email: 'fulano@exemplo.gov.br',
        senha: 'a'.repeat(8),
      }).senha,
    ).toHaveLength(8);
    expect(() =>
      alterarSenhaSchema.parse({
        senhaAtual: 'atual',
        novaSenha: 'a'.repeat(7),
      }),
    ).toThrow();
    expect(
      alterarSenhaSchema.parse({
        senhaAtual: 'atual',
        novaSenha: 'a'.repeat(8),
      }).novaSenha,
    ).toHaveLength(8);
  });
});

describe('sessões', () => {
  it('valida identificadores de sessão', () => {
    expect(() => sessaoIdParamSchema.parse({ id: 'invalido' })).toThrow();
    expect(() =>
      usuarioSessaoParamSchema.parse({ id: '1', sessaoId: 'invalido' }),
    ).toThrow();
  });
});

describe('código MFA', () => {
  it('aceita código TOTP e código de recuperação', () => {
    expect(mfaCodigoSchema.parse({ codigo: '123456' }).codigo).toBe('123456');
    expect(
      mfaCodigoSchema.parse({ codigo: 'ABCDE-12345' }).codigo,
    ).toBe('ABCDE-12345');
  });

  it('aceita códigos TOTP de 4 a 8 dígitos', () => {
    for (const codigo of ['1234', '12345', '123456', '1234567', '12345678']) {
      expect(mfaCodigoSchema.parse({ codigo }).codigo).toBe(codigo);
    }
  });

  it('rejeita código curto', () => {
    expect(() => mfaCodigoSchema.parse({ codigo: '123' })).toThrow();
  });
});

describe('filtros de tarefas e visões', () => {
  it('converte filtros booleanos da query', () => {
    expect(
      listarTarefaQuerySchema.parse({ atrasado: 'true', status: 'PENDENTE' })
        .atrasado,
    ).toBe(true);
    expect(
      listarTarefaQuerySchema.parse({ atrasado: 'false' }).atrasado,
    ).toBe(false);
  });

  it('rejeita filtros desconhecidos em visões salvas', () => {
    expect(() =>
      salvarVisaoSchema.parse({
        nome: 'Minhas pendências',
        filtros: { status: 'EM_ANDAMENTO', sql: 'DROP TABLE processos' },
      }),
    ).toThrow();
  });

  it('aceita filtros válidos e rejeita nome vazio', () => {
    expect(
      salvarVisaoSchema.parse({
        nome: 'Atrasados',
        filtros: { atrasado: true, responsavelAtualId: 3 },
      }).filtros,
    ).toEqual({ atrasado: true, responsavelAtualId: 3 });
    expect(() =>
      salvarVisaoSchema.parse({ nome: '   ', filtros: {} }),
    ).toThrow();
  });
});

describe('papel principal do usuário', () => {
  it('aceita um papel principal entre os papéis selecionados', () => {
    expect(
      definirRolesSchema.parse({
        roleIds: [1, 2],
        papelPrincipalId: 2,
      }),
    ).toEqual({ roleIds: [1, 2], papelPrincipalId: 2 });
  });

  it('rejeita papel principal fora dos papéis selecionados', () => {
    expect(() =>
      definirRolesSchema.parse({
        roleIds: [1, 2],
        papelPrincipalId: 3,
      }),
    ).toThrow('O papel principal deve estar entre os papéis selecionados.');
  });

  it('aceita papel principal omitido ou nulo', () => {
    expect(definirRolesSchema.parse({ roleIds: [1] })).toEqual({
      roleIds: [1],
    });
    expect(
      definirRolesSchema.parse({ roleIds: [1], papelPrincipalId: null }),
    ).toEqual({ roleIds: [1], papelPrincipalId: null });
  });
});
