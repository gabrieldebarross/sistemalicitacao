import { describe, expect, it } from 'vitest';

import { gerarTokenAleatorio, hashToken } from '../../src/utils/security.js';

describe('utilitários de token', () => {
  it('gera hash determinístico em SHA-256', () => {
    const hash = hashToken('token-de-teste');
    expect(hash).toHaveLength(64);
    expect(hash).toBe(hashToken('token-de-teste'));
    expect(hash).not.toBe(hashToken('outro-token'));
  });

  it('gera tokens aleatórios de alta entropia', () => {
    const primeiro = gerarTokenAleatorio();
    const segundo = gerarTokenAleatorio();
    expect(primeiro).toHaveLength(64);
    expect(primeiro).not.toBe(segundo);
  });

  it('respeita a quantidade de bytes solicitada', () => {
    expect(gerarTokenAleatorio(16)).toHaveLength(32);
  });
});
