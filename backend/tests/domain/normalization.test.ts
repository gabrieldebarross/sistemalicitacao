import { describe, expect, it } from 'vitest';

import {
  normalizarEmail,
  normalizarNome,
} from '../../src/domain/normalization.js';

describe('normalizarNome', () => {
  it('aplica Title Case preservando conectores', () => {
    expect(normalizarNome('técnico em enfermagem')).toBe(
      'Técnico em Enfermagem',
    );
    expect(normalizarNome('AGENTE DE ADMINISTRAÇÃO')).toBe(
      'Agente de Administração',
    );
  });

  it('remove espaços extras', () => {
    expect(normalizarNome('  analista   judiciário  ')).toBe(
      'Analista Judiciário',
    );
  });

  it('mantém nomes vazios', () => {
    expect(normalizarNome('   ')).toBe('');
  });
});

describe('normalizarEmail', () => {
  it('remove espaços e coloca em minúsculas', () => {
    expect(normalizarEmail('  Usuario@EXEMPLO.com ')).toBe(
      'usuario@exemplo.com',
    );
  });
});
