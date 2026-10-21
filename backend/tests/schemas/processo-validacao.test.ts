import { describe, expect, it } from 'vitest';

import {
  atribuirEtapaSchema,
  atualizarPerfilSchema,
  atualizarPrazoEtapaSchema,
  atualizarUsuarioSchema,
  bloquearEtapaSchema,
  criarProcessoSchema,
  definirSetoresSchema,
  desbloquearEtapaSchema,
  pularEtapaSchema,
  selecaoEtapaCondicionalSchema,
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

  it('aceita setor explícito ou sua remoção', () => {
    expect(
      atribuirEtapaSchema.parse({ responsavelId: 4, setorId: '2' }).setorId,
    ).toBe(2);
    expect(
      atribuirEtapaSchema.parse({ responsavelId: 4, setorId: null }).setorId,
    ).toBeNull();
    expect(() =>
      atribuirEtapaSchema.parse({ responsavelId: 4, setorId: 0 }),
    ).toThrow();
  });
});

describe('validação de prazo da etapa', () => {
  it('aceita prazo positivo e remoção do prazo', () => {
    expect(
      atualizarPrazoEtapaSchema.parse({ prazoGestaoDias: '10' })
        .prazoGestaoDias,
    ).toBe(10);
    expect(
      atualizarPrazoEtapaSchema.parse({ prazoGestaoDias: null })
        .prazoGestaoDias,
    ).toBeNull();
  });

  it('rejeita prazo zero ou negativo', () => {
    expect(() =>
      atualizarPrazoEtapaSchema.parse({ prazoGestaoDias: 0 }),
    ).toThrow();
    expect(() =>
      atualizarPrazoEtapaSchema.parse({ prazoGestaoDias: -5 }),
    ).toThrow();
  });
});

describe('validação de setores do usuário', () => {
  it('aceita setores e setor principal entre os selecionados', () => {
    const dados = definirSetoresSchema.parse({
      setorIds: ['1', '2'],
      setorPrincipalId: '2',
    });
    expect(dados.setorIds).toEqual([1, 2]);
    expect(dados.setorPrincipalId).toBe(2);
  });

  it('rejeita setor principal fora da seleção', () => {
    expect(() =>
      definirSetoresSchema.parse({ setorIds: [1], setorPrincipalId: 2 }),
    ).toThrow();
  });

  it('aceita remoção de todos os setores', () => {
    const dados = definirSetoresSchema.parse({ setorIds: [] });
    expect(dados.setorIds).toHaveLength(0);
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

describe('validação de etapas condicionais', () => {
  it('aceita seleção aplicável sem justificativa', () => {
    const selecao = selecaoEtapaCondicionalSchema.parse({
      etapaId: '5',
      aplicavel: true,
    });
    expect(selecao.etapaId).toBe(5);
    expect(selecao.aplicavel).toBe(true);
  });

  it('exige justificativa quando a etapa não é aplicável', () => {
    expect(() =>
      selecaoEtapaCondicionalSchema.parse({
        etapaId: 5,
        aplicavel: false,
      }),
    ).toThrow();
    expect(() =>
      selecaoEtapaCondicionalSchema.parse({
        etapaId: 5,
        aplicavel: false,
        justificativa: 'não',
      }),
    ).toThrow();
  });

  it('aceita justificativa válida para etapa não aplicável', () => {
    const selecao = selecaoEtapaCondicionalSchema.parse({
      etapaId: 5,
      aplicavel: false,
      justificativa: 'Não há recurso previsto neste caso.',
    });
    expect(selecao.aplicavel).toBe(false);
    expect(selecao.justificativa).toContain('Não há recurso');
  });

  it('aceita lista de seleções no payload de criação', () => {
    const dados = criarProcessoSchema.parse({
      numero: 'PROC-2026-003',
      objeto: 'Objeto',
      tipoProcessoId: 1,
      fluxoId: 2,
      etapasCondicionais: [
        {
          etapaId: 10,
          aplicavel: false,
          justificativa: 'Etapa não prevista para o objeto.',
        },
      ],
    });
    expect(dados.etapasCondicionais).toHaveLength(1);
  });
});

describe('validação dos controles de etapa', () => {
  it('exige motivo mínimo para bloqueio', () => {
    expect(() => bloquearEtapaSchema.parse({ motivo: 'ok' })).toThrow();
    expect(
      bloquearEtapaSchema.parse({ motivo: 'Aguardando documentação.' }).motivo,
    ).toBe('Aguardando documentação.');
  });

  it('exige justificativa para desbloqueio e pulo', () => {
    expect(() =>
      desbloquearEtapaSchema.parse({ justificativa: 'ok' }),
    ).toThrow();
    expect(() => pularEtapaSchema.parse({ justificativa: 'ok' })).toThrow();
    expect(
      pularEtapaSchema.parse({
        justificativa: 'Etapa não se aplica a este objeto.',
      }).justificativa,
    ).toContain('não se aplica');
  });
});
