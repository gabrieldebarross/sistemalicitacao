import { describe, expect, it } from 'vitest';

import {
  atribuirEtapaSchema,
  atualizarPerfilSchema,
  atualizarUsuarioSchema,
  criarProcessoSchema,
} from '../../src/schemas/index.js';

describe('validação de criação de processo', () => {
  it('aceita nome e fluxo publicado escolhido', () => {
    const dados = criarProcessoSchema.parse({
      nome: 'Aquisição de material de escritório',
      numero: 'PROC-2026-001',
      objeto: 'Material de expediente',
      tipoProcessoId: '3',
      fluxoId: '7',
    });
    expect(dados.tipoProcessoId).toBe(3);
    expect(dados.fluxoId).toBe(7);
  });

  it('mantém compatibilidade quando o fluxo não é informado', () => {
    const dados = criarProcessoSchema.parse({
      numero: 'PROC-2026-002',
      objeto: 'Serviço de manutenção',
      tipoProcessoId: 1,
    });
    expect(dados.fluxoId).toBeUndefined();
  });

  it('rejeita processo sem número', () => {
    expect(() =>
      criarProcessoSchema.parse({ objeto: 'Objeto', tipoProcessoId: 1 }),
    ).toThrow();
  });
});

describe('validação de perfil', () => {
  it('aceita nome ou e-mail isoladamente', () => {
    expect(atualizarPerfilSchema.parse({ nome: 'Fulano' }).nome).toBe('Fulano');
    expect(
      atualizarPerfilSchema.parse({ email: 'fulano@exemplo.gov.br' }).email,
    ).toBe('fulano@exemplo.gov.br');
  });

  it('rejeita atualização sem campos', () => {
    expect(() => atualizarPerfilSchema.parse({})).toThrow();
  });
});

describe('validação de atribuição por etapa', () => {
  it('aceita responsável válido e remoção', () => {
    expect(atribuirEtapaSchema.parse({ responsavelId: 4 }).responsavelId).toBe(
      4,
    );
    expect(
      atribuirEtapaSchema.parse({ responsavelId: null }).responsavelId,
    ).toBeNull();
  });

  it('rejeita identificador inválido', () => {
    expect(() => atribuirEtapaSchema.parse({ responsavelId: 0 })).toThrow();
  });
});

describe('validação de usuário', () => {
  it('aceita redefinição de senha no update', () => {
    const dados = atualizarUsuarioSchema.parse({ senha: 'senhaSegura123' });
    expect(dados.senha).toBe('senhaSegura123');
  });

  it('rejeita senha curta', () => {
    expect(() => atualizarUsuarioSchema.parse({ senha: 'curta' })).toThrow();
  });
});
