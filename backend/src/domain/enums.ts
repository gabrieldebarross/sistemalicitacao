/**
 * Enumerações de domínio. Os valores coincidem com os ENUM do banco e são a
 * fonte de verdade para validação e transições.
 */

export const FLUXO_SITUACAO = {
  RASCUNHO: 'RASCUNHO',
  PUBLICADO: 'PUBLICADO',
  ARQUIVADO: 'ARQUIVADO',
} as const;
export type FluxoSituacao =
  (typeof FLUXO_SITUACAO)[keyof typeof FLUXO_SITUACAO];

export const PROCESSO_STATUS = {
  RASCUNHO: 'RASCUNHO',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  SUSPENSO: 'SUSPENSO',
  CONCLUIDO: 'CONCLUIDO',
  ANULADO: 'ANULADO',
  REVOGADO: 'REVOGADO',
} as const;
export type ProcessoStatus =
  (typeof PROCESSO_STATUS)[keyof typeof PROCESSO_STATUS];

export const PROCESSO_ETAPA_STATUS = {
  PENDENTE: 'PENDENTE',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  CONCLUIDA: 'CONCLUIDA',
  BLOQUEADA: 'BLOQUEADA',
  PULADA: 'PULADA',
} as const;
export type ProcessoEtapaStatus =
  (typeof PROCESSO_ETAPA_STATUS)[keyof typeof PROCESSO_ETAPA_STATUS];

export const MOVIMENTACAO_TIPO = {
  CRIACAO: 'CRIACAO',
  INICIO_ETAPA: 'INICIO_ETAPA',
  CONCLUSAO_ETAPA: 'CONCLUSAO_ETAPA',
  CONCLUSAO_PROCESSO: 'CONCLUSAO_PROCESSO',
  ENCAMINHAMENTO: 'ENCAMINHAMENTO',
  DEVOLUCAO: 'DEVOLUCAO',
  ALTERACAO: 'ALTERACAO',
  SUSPENSAO: 'SUSPENSAO',
  RETOMADA: 'RETOMADA',
  OBSERVACAO: 'OBSERVACAO',
  BLOQUEIO: 'BLOQUEIO',
  DESBLOQUEIO: 'DESBLOQUEIO',
  PULO_ETAPA: 'PULO_ETAPA',
} as const;
export type MovimentacaoTipo =
  (typeof MOVIMENTACAO_TIPO)[keyof typeof MOVIMENTACAO_TIPO];

export const AUDITORIA_RESULTADO = {
  SUCESSO: 'SUCESSO',
  FALHA: 'FALHA',
} as const;
export type AuditoriaResultado =
  (typeof AUDITORIA_RESULTADO)[keyof typeof AUDITORIA_RESULTADO];
