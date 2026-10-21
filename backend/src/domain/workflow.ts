import {
  PROCESSO_ETAPA_STATUS,
  PROCESSO_STATUS,
  type ProcessoEtapaStatus,
  type ProcessoStatus,
} from './enums.js';

/**
 * Máquina de estados do workflow. Define transições válidas de processo e de
 * etapa. Regras de negócio ficam aqui, não em controllers.
 */

const TRANSICOES_PROCESSO: Readonly<
  Record<ProcessoStatus, readonly ProcessoStatus[]>
> = {
  RASCUNHO: ['EM_ANDAMENTO', 'ANULADO'],
  EM_ANDAMENTO: ['SUSPENSO', 'CONCLUIDO', 'ANULADO', 'REVOGADO'],
  SUSPENSO: ['EM_ANDAMENTO', 'ANULADO', 'REVOGADO'],
  CONCLUIDO: [],
  ANULADO: [],
  REVOGADO: [],
};

const TRANSICOES_ETAPA: Readonly<
  Record<ProcessoEtapaStatus, readonly ProcessoEtapaStatus[]>
> = {
  PENDENTE: ['EM_ANDAMENTO', 'PULADA'],
  EM_ANDAMENTO: ['CONCLUIDA', 'BLOQUEADA', 'PULADA'],
  BLOQUEADA: ['EM_ANDAMENTO'],
  CONCLUIDA: [],
  PULADA: [],
};

export function podeTransicionarProcesso(
  de: ProcessoStatus,
  para: ProcessoStatus,
): boolean {
  return TRANSICOES_PROCESSO[de].includes(para);
}

export function podeTransicionarEtapa(
  de: ProcessoEtapaStatus,
  para: ProcessoEtapaStatus,
): boolean {
  return TRANSICOES_ETAPA[de].includes(para);
}

export function processoTerminal(status: ProcessoStatus): boolean {
  return (
    status === PROCESSO_STATUS.CONCLUIDO ||
    status === PROCESSO_STATUS.ANULADO ||
    status === PROCESSO_STATUS.REVOGADO
  );
}

export function etapaConcluida(status: ProcessoEtapaStatus): boolean {
  return (
    status === PROCESSO_ETAPA_STATUS.CONCLUIDA ||
    status === PROCESSO_ETAPA_STATUS.PULADA
  );
}

export interface EtapaSequencial {
  id: number;
  sequencia: number;
  status: ProcessoEtapaStatus;
  obrigatoria: boolean;
}

/** Próxima etapa não finalizada, respeitando a ordem de sequência. */
export function proximaEtapaPendente<T extends EtapaSequencial>(
  etapas: readonly T[],
): T | undefined {
  return [...etapas]
    .sort((a, b) => a.sequencia - b.sequencia)
    .find((etapa) => !etapaConcluida(etapa.status));
}

/** Todas as etapas (não puladas) concluídas? */
export function fluxoCompleto(etapas: readonly EtapaSequencial[]): boolean {
  return etapas.every(
    (etapa) =>
      etapa.status === PROCESSO_ETAPA_STATUS.CONCLUIDA ||
      etapa.status === PROCESSO_ETAPA_STATUS.PULADA,
  );
}

export interface EtapaPulavel extends EtapaSequencial {
  permitePulo: boolean;
}

/**
 * Uma etapa só pode ser pulada se estiver pendente/em andamento e, quando
 * obrigatória, se o fluxo permitir explicitamente o pulo. Etapas opcionais não
 * exigem `permitePulo`; o motivo sempre é registrado pelo serviço.
 */
export function etapaPodeSerPulada(etapa: EtapaPulavel): boolean {
  if (
    etapa.status !== PROCESSO_ETAPA_STATUS.PENDENTE &&
    etapa.status !== PROCESSO_ETAPA_STATUS.EM_ANDAMENTO
  ) {
    return false;
  }
  return !etapa.obrigatoria || etapa.permitePulo;
}

export interface PendenciasConclusao<T extends EtapaSequencial> {
  obrigatorias: T[];
  opcionais: T[];
}

/**
 * Classifica as etapas ainda não finalizadas para a conclusão do processo.
 * Obrigatórias bloqueiam a conclusão; opcionais podem ser puladas
 * automaticamente com motivo registrado.
 */
export function classificarPendenciasConclusao<T extends EtapaSequencial>(
  etapas: readonly T[],
): PendenciasConclusao<T> {
  const pendentes = etapas.filter((etapa) => !etapaConcluida(etapa.status));
  return {
    obrigatorias: pendentes.filter((etapa) => etapa.obrigatoria),
    opcionais: pendentes.filter((etapa) => !etapa.obrigatoria),
  };
}

export interface EtapaComRetorno extends EtapaSequencial {
  retornoParaEtapaId: number | null;
}

/**
 * Define o destino após concluir uma etapa. Se a etapa havia sido devolvida,
 * retorna diretamente para a etapa que originou a devolução, sem refazer as
 * etapas intermediárias que já estavam concluídas. Sem devolução pendente,
 * segue a próxima etapa não finalizada na ordem sequencial.
 */
export function proximaEtapaAposConclusao<T extends EtapaComRetorno>(
  etapas: readonly T[],
  atual: T,
): T | undefined {
  const retorno = atual.retornoParaEtapaId
    ? etapas.find(
        (etapa) =>
          etapa.id === atual.retornoParaEtapaId &&
          !etapaConcluida(etapa.status),
      )
    : undefined;
  if (retorno) {
    return retorno;
  }
  return [...etapas]
    .filter(
      (etapa) =>
        etapa.sequencia > atual.sequencia && !etapaConcluida(etapa.status),
    )
    .sort((a, b) => a.sequencia - b.sequencia)[0];
}
