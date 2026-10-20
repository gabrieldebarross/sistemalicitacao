import { describe, expect, it } from 'vitest';

import { PROCESSO_ETAPA_STATUS, PROCESSO_STATUS } from '../../src/domain/enums.js';
import {
  etapaConcluida,
  fluxoCompleto,
  podeTransicionarEtapa,
  podeTransicionarProcesso,
  processoTerminal,
  proximaEtapaPendente,
} from '../../src/domain/workflow.js';

describe('workflow de processo', () => {
  it('permite transições válidas a partir de rascunho', () => {
    expect(
      podeTransicionarProcesso(
        PROCESSO_STATUS.RASCUNHO,
        PROCESSO_STATUS.EM_ANDAMENTO,
      ),
    ).toBe(true);
    expect(
      podeTransicionarProcesso(PROCESSO_STATUS.RASCUNHO, PROCESSO_STATUS.ANULADO),
    ).toBe(true);
  });

  it('nega transições inválidas', () => {
    expect(
      podeTransicionarProcesso(
        PROCESSO_STATUS.CONCLUIDO,
        PROCESSO_STATUS.EM_ANDAMENTO,
      ),
    ).toBe(false);
    expect(
      podeTransicionarProcesso(
        PROCESSO_STATUS.ANULADO,
        PROCESSO_STATUS.REVOGADO,
      ),
    ).toBe(false);
    expect(
      podeTransicionarProcesso(
        PROCESSO_STATUS.RASCUNHO,
        PROCESSO_STATUS.CONCLUIDO,
      ),
    ).toBe(false);
  });

  it('reconhece estados terminais', () => {
    expect(processoTerminal(PROCESSO_STATUS.CONCLUIDO)).toBe(true);
    expect(processoTerminal(PROCESSO_STATUS.ANULADO)).toBe(true);
    expect(processoTerminal(PROCESSO_STATUS.REVOGADO)).toBe(true);
    expect(processoTerminal(PROCESSO_STATUS.EM_ANDAMENTO)).toBe(false);
  });
});

describe('workflow de etapa', () => {
  it('permite avançar de pendente para em andamento', () => {
    expect(
      podeTransicionarEtapa(
        PROCESSO_ETAPA_STATUS.PENDENTE,
        PROCESSO_ETAPA_STATUS.EM_ANDAMENTO,
      ),
    ).toBe(true);
  });

  it('nega retroceder de concluída para em andamento', () => {
    expect(
      podeTransicionarEtapa(
        PROCESSO_ETAPA_STATUS.CONCLUIDA,
        PROCESSO_ETAPA_STATUS.EM_ANDAMENTO,
      ),
    ).toBe(false);
  });
});

describe('seleção de etapas', () => {
  const etapas = [
    { id: 2, sequencia: 2, status: PROCESSO_ETAPA_STATUS.PENDENTE, obrigatoria: true },
    { id: 1, sequencia: 1, status: PROCESSO_ETAPA_STATUS.CONCLUIDA, obrigatoria: true },
    { id: 3, sequencia: 3, status: PROCESSO_ETAPA_STATUS.PENDENTE, obrigatoria: false },
  ] as const;

  it('ordena e retorna a próxima etapa não finalizada', () => {
    const proxima = proximaEtapaPendente([...etapas]);
    expect(proxima?.id).toBe(2);
  });

  it('identifica fluxo completo', () => {
    expect(fluxoCompleto([...etapas])).toBe(false);
    expect(
      fluxoCompleto([
        { id: 1, sequencia: 1, status: PROCESSO_ETAPA_STATUS.CONCLUIDA, obrigatoria: true },
        { id: 2, sequencia: 2, status: PROCESSO_ETAPA_STATUS.PULADA, obrigatoria: false },
      ]),
    ).toBe(true);
  });

  it('considera concluída e pulada como finalizadas', () => {
    expect(etapaConcluida(PROCESSO_ETAPA_STATUS.CONCLUIDA)).toBe(true);
    expect(etapaConcluida(PROCESSO_ETAPA_STATUS.PULADA)).toBe(true);
    expect(etapaConcluida(PROCESSO_ETAPA_STATUS.PENDENTE)).toBe(false);
  });
});
