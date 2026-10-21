import { describe, expect, it } from 'vitest';

import { diffAuditoria } from '../../src/utils/audit-diff.js';

describe('diff de auditoria', () => {
  it('registra apenas campos alterados dentro da allowlist', () => {
    const diferencas = diffAuditoria(
      { nome: 'Antigo', objeto: 'Objeto', ignorado: 'a' },
      { nome: 'Novo', objeto: 'Objeto', ignorado: 'b' },
      ['nome', 'objeto'],
    );
    expect(diferencas).toEqual({
      nome: { anterior: 'Antigo', novo: 'Novo' },
    });
  });

  it('não expõe campos sensíveis', () => {
    const diferencas = diffAuditoria(
      { nome: 'Fulano', senhaHash: 'hash-antigo' },
      { nome: 'Fulano', senhaHash: 'hash-novo' },
      ['nome', 'senhaHash'],
    );
    expect(diferencas.senhaHash).toEqual({
      anterior: '[PROTEGIDO]',
      novo: '[PROTEGIDO]',
    });
    expect(JSON.stringify(diferencas)).not.toContain('hash-');
  });

  it('trunca textos longos', () => {
    const diferencas = diffAuditoria(
      { descricao: 'a'.repeat(600) },
      { descricao: 'b'.repeat(600) },
      ['descricao'],
    );
    expect(String(diferencas.descricao?.novo)).toHaveLength(501);
    expect(String(diferencas.descricao?.novo).endsWith('…')).toBe(true);
  });

  it('normaliza datas para ISO', () => {
    const anterior = new Date('2026-01-01T00:00:00.000Z');
    const novo = new Date('2026-01-02T00:00:00.000Z');
    const diferencas = diffAuditoria(
      { prazo: anterior },
      { prazo: novo },
      ['prazo'],
    );
    expect(diferencas.prazo).toEqual({
      anterior: anterior.toISOString(),
      novo: novo.toISOString(),
    });
  });

  it('ignora campos ausentes ou sem alteração', () => {
    const diferencas = diffAuditoria({}, {}, ['nome']);
    expect(diferencas).toEqual({});
  });
});
