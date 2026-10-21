import { describe, expect, it } from 'vitest';

import { duracaoParaMs } from '../../src/utils/duration.js';

describe('duração de tokens', () => {
  it('converte minutos, horas e dias', () => {
    expect(duracaoParaMs('15m')).toBe(15 * 60_000);
    expect(duracaoParaMs('2h')).toBe(2 * 3_600_000);
    expect(duracaoParaMs('7d')).toBe(7 * 86_400_000);
    expect(duracaoParaMs('1w')).toBe(604_800_000);
  });

  it('aceita milissegundos como unidade padrão', () => {
    expect(duracaoParaMs('500')).toBe(500);
    expect(duracaoParaMs('500ms')).toBe(500);
  });

  it('tolera espaços e maiúsculas', () => {
    expect(duracaoParaMs(' 15 M ')).toBe(15 * 60_000);
  });

  it('rejeita valores inválidos', () => {
    expect(() => duracaoParaMs('')).toThrow();
    expect(() => duracaoParaMs('abc')).toThrow();
    expect(() => duracaoParaMs('15x')).toThrow();
  });
});
