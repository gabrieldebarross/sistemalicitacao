import { describe, expect, it } from 'vitest';

import { env } from '../../src/config/env.js';
import {
  alterarSenhaSchema,
  criarUsuarioSchema,
  listarTarefaQuerySchema,
  mfaCodigoSchema,
  salvarVisaoSchema,
  sessaoIdParamSchema,
  usuarioSessaoParamSchema,
} from '../../src/schemas/index.js';

describe('política de senha', () => {
  it('exige no mínimo 12 caracteres', () => {
    expect(env.password.minLength).toBeGreaterThanOrEqual(12);
    expect(() =>
      criarUsuarioSchema.parse({
        nome: 'Fulano',
        email: 'fulano@exemplo.gov.br',
        senha: 'a'.repeat(11),
      }),
    ).toThrow();
    expect(
      criarUsuarioSchema.parse({
        nome: 'Fulano',
        email: 'fulano@exemplo.gov.br',
        senha: 'a'.repeat(12),
      }).senha,
    ).toHaveLength(12);
    expect(() =>
      alterarSenhaSchema.parse({
        senhaAtual: 'atual',
        novaSenha: 'a'.repeat(11),
      }),
    ).toThrow();
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
