export function formatarData(valor: string | Date | null | undefined): string {
  if (!valor) {
    return '—';
  }
  const data = typeof valor === 'string' ? new Date(valor) : valor;
  if (Number.isNaN(data.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('pt-BR').format(data);
}

export function formatarDataHora(
  valor: string | Date | null | undefined,
): string {
  if (!valor) {
    return '—';
  }
  const data = typeof valor === 'string' ? new Date(valor) : valor;
  if (Number.isNaN(data.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data);
}

export const ROTULOS_STATUS_PROCESSO: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  EM_ANDAMENTO: 'Em andamento',
  SUSPENSO: 'Suspenso',
  CONCLUIDO: 'Concluído',
  ANULADO: 'Anulado',
  REVOGADO: 'Revogado',
};

export const ROTULOS_STATUS_ETAPA: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  BLOQUEADA: 'Bloqueada',
  PULADA: 'Pulada',
};

export const ROTULOS_SITUACAO_FLUXO: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  PUBLICADO: 'Publicado',
  ARQUIVADO: 'Arquivado',
};

export const ROTULOS_MOVIMENTACAO: Record<string, string> = {
  CRIACAO: 'Criação',
  INICIO_ETAPA: 'Início de etapa',
  CONCLUSAO_ETAPA: 'Conclusão de etapa',
  CONCLUSAO_PROCESSO: 'Conclusão do processo',
  ENCAMINHAMENTO: 'Encaminhamento',
  DEVOLUCAO: 'Devolução',
  ALTERACAO: 'Alteração',
  SUSPENSAO: 'Suspensão',
  RETOMADA: 'Retomada',
  OBSERVACAO: 'Observação',
  BLOQUEIO: 'Bloqueio de etapa',
  DESBLOQUEIO: 'Desbloqueio de etapa',
  PULO_ETAPA: 'Pulo de etapa',
};
