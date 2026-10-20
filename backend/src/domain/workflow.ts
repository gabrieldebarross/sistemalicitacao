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
  EM_ANDAMENTO: ['CONCLUIDA', 'BLOQUEADA'],
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

export interface EtapaComRetorno extends EtapaSequencial {
  retornoParaEtapaId: number | null;
}

/**
 * Define o destino após concluir uma etapa. Se a etapa havia sido devolvida,
 * o fluxo refaz primeiro as etapas intermediárias reabertas e só então retorna
 * para a etapa que originou a devolução. Sem devolução pendente, segue a
 * próxima etapa não finalizada na ordem sequencial.
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

  const proximaSequencial = [...etapas]
    .filter(
      (etapa) =>
        etapa.sequencia > atual.sequencia && !etapaConcluida(etapa.status),
    )
    .sort((a, b) => a.sequencia - b.sequencia)[0];

  if (
    retorno &&
    (!proximaSequencial ||
      proximaSequencial.sequencia >= retorno.sequencia)
  ) {
    return retorno;
  }
  return proximaSequencial;
}
