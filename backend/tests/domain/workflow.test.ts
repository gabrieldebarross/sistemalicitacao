import { describe, expect, it } from 'vitest';

import { PROCESSO_ETAPA_STATUS, PROCESSO_STATUS } from '../../src/domain/enums.js';
import {
  classificarPendenciasConclusao,
  etapaConcluida,
  etapaPodeSerPulada,
  fluxoCompleto,
  podeTransicionarEtapa,
  podeTransicionarProcesso,
  processoTerminal,
  proximaEtapaAposConclusao,
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

describe('retorno após devolução', () => {
  const etapas = [
    {
      id: 1,
      sequencia: 1,
      status: PROCESSO_ETAPA_STATUS.CONCLUIDA,
      obrigatoria: true,
      retornoParaEtapaId: null,
    },
    {
      id: 2,
      sequencia: 2,
      status: PROCESSO_ETAPA_STATUS.EM_ANDAMENTO,
      obrigatoria: true,
      retornoParaEtapaId: 3,
    },
    {
      id: 3,
      sequencia: 3,
      status: PROCESSO_ETAPA_STATUS.PENDENTE,
      obrigatoria: true,
      retornoParaEtapaId: null,
    },
    {
      id: 4,
      sequencia: 4,
      status: PROCESSO_ETAPA_STATUS.PENDENTE,
      obrigatoria: true,
      retornoParaEtapaId: null,
    },
  ] as const;

  it('retorna para a etapa que originou a devolução', () => {
    const proxima = proximaEtapaAposConclusao([...etapas], etapas[1]);
    expect(proxima?.id).toBe(3);
  });

  it('retorna diretamente à origem, sem refazer etapas intermediárias', () => {
    const comOrigemDistante = etapas.map((etapa) =>
      etapa.id === 2
        ? { ...etapa, retornoParaEtapaId: 4 }
        : etapa,
    );
    const atual = comOrigemDistante[1];
    const proxima = proximaEtapaAposConclusao(comOrigemDistante, atual);
    expect(proxima?.id).toBe(4);
  });

  it('segue a ordem linear quando não há retorno pendente', () => {
    const proxima = proximaEtapaAposConclusao([...etapas], etapas[0]);
    expect(proxima?.id).toBe(2);
  });

  it('ignora retorno para etapa já finalizada', () => {
    const proxima = proximaEtapaAposConclusao(
      [
        ...etapas,
        {
          id: 5,
          sequencia: 5,
          status: PROCESSO_ETAPA_STATUS.EM_ANDAMENTO,
          obrigatoria: true,
          retornoParaEtapaId: 1,
        },
      ],
      {
        id: 5,
        sequencia: 5,
        status: PROCESSO_ETAPA_STATUS.EM_ANDAMENTO,
        obrigatoria: true,
        retornoParaEtapaId: 1,
      },
    );
    expect(proxima).toBeUndefined();
  });
});

describe('pulo de etapa', () => {
  const base = {
    id: 1,
    sequencia: 1,
    status: PROCESSO_ETAPA_STATUS.PENDENTE,
    obrigatoria: true,
  } as const;

  it('permite pular etapa obrigatória somente com permitePulo', () => {
    expect(etapaPodeSerPulada({ ...base, permitePulo: false })).toBe(false);
    expect(etapaPodeSerPulada({ ...base, permitePulo: true })).toBe(true);
  });

  it('permite pular etapa opcional sem permitePulo', () => {
    expect(
      etapaPodeSerPulada({ ...base, obrigatoria: false, permitePulo: false }),
    ).toBe(true);
  });

  it('nega pulo de etapa bloqueada, concluída ou já pulada', () => {
    for (const status of [
      PROCESSO_ETAPA_STATUS.BLOQUEADA,
      PROCESSO_ETAPA_STATUS.CONCLUIDA,
      PROCESSO_ETAPA_STATUS.PULADA,
    ]) {
      expect(
        etapaPodeSerPulada({
          ...base,
          status,
          obrigatoria: false,
          permitePulo: true,
        }),
      ).toBe(false);
    }
  });

  it('aceita pulo de etapa em andamento', () => {
    expect(
      etapaPodeSerPulada({
        ...base,
        status: PROCESSO_ETAPA_STATUS.EM_ANDAMENTO,
        obrigatoria: true,
        permitePulo: true,
      }),
    ).toBe(true);
  });
});

describe('pendências para conclusão do processo', () => {
  it('separa obrigatórias e opcionais não finalizadas', () => {
    const pendencias = classificarPendenciasConclusao([
      {
        id: 1,
        sequencia: 1,
        status: PROCESSO_ETAPA_STATUS.CONCLUIDA,
        obrigatoria: true,
      },
      {
        id: 2,
        sequencia: 2,
        status: PROCESSO_ETAPA_STATUS.EM_ANDAMENTO,
        obrigatoria: true,
      },
      {
        id: 3,
        sequencia: 3,
        status: PROCESSO_ETAPA_STATUS.BLOQUEADA,
        obrigatoria: false,
      },
      {
        id: 4,
        sequencia: 4,
        status: PROCESSO_ETAPA_STATUS.PULADA,
        obrigatoria: true,
      },
    ]);
    expect(pendencias.obrigatorias.map((etapa) => etapa.id)).toEqual([2]);
    expect(pendencias.opcionais.map((etapa) => etapa.id)).toEqual([3]);
  });

  it('não retorna pendências quando tudo está concluído ou pulado', () => {
    const pendencias = classificarPendenciasConclusao([
      {
        id: 1,
        sequencia: 1,
        status: PROCESSO_ETAPA_STATUS.CONCLUIDA,
        obrigatoria: true,
      },
      {
        id: 2,
        sequencia: 2,
        status: PROCESSO_ETAPA_STATUS.PULADA,
        obrigatoria: false,
      },
    ]);
    expect(pendencias.obrigatorias).toHaveLength(0);
    expect(pendencias.opcionais).toHaveLength(0);
  });
});
