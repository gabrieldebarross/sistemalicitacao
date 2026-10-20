import type { Permissao } from './tipos';

/**
 * Rótulos legíveis para códigos internos (permissões, ações e recursos de
 * auditoria), evitando exibir identificadores crus na interface.
 */

const ROTULOS_MODULO: Record<string, string> = {
  processos: 'Processos',
  fluxos: 'Fluxos de trabalho',
  setores: 'Setores',
  cargos: 'Cargos',
  'tipos-processo': 'Tipos de processo',
  usuarios: 'Usuários',
  roles: 'Papéis',
  permissions: 'Permissões',
  audit: 'Auditoria',
  reports: 'Relatórios e painel',
};

export interface GrupoPermissoes {
  modulo: string;
  itens: Permissao[];
}

function prefixoDe(codigo: string): string {
  return codigo.split('.')[0] ?? '';
}

export function moduloDePermissao(codigo: string): string {
  return ROTULOS_MODULO[prefixoDe(codigo)] ?? 'Outros';
}

/** Agrupa permissões por módulo, preservando a ordem de aparição. */
export function agruparPermissoes(permissoes: Permissao[]): GrupoPermissoes[] {
  const grupos = new Map<string, Permissao[]>();
  for (const permissao of permissoes) {
    const modulo = moduloDePermissao(permissao.codigo);
    const atual = grupos.get(modulo) ?? [];
    atual.push(permissao);
    grupos.set(modulo, atual);
  }
  return [...grupos.entries()].map(([modulo, itens]) => ({ modulo, itens }));
}

export const ACOES_AUDITORIA: Record<string, string> = {
  LOGIN: 'Login',
  ALTERAR_SENHA: 'Alteração de senha',
  CRIAR: 'Criação',
  ALTERAR: 'Alteração',
  DESATIVAR: 'Desativação',
  DEFINIR_ROLES: 'Definição de papéis',
  DEFINIR_PERMISSOES: 'Definição de permissões',
  INICIAR: 'Início do processo',
  CONCLUIR_ETAPA: 'Conclusão de etapa',
  DEVOLVER_ETAPA: 'Devolução de etapa',
  ATRIBUIR: 'Atribuição de responsável',
  SUSPENDER: 'Suspensão',
  RETOMAR: 'Retomada',
  PUBLICAR: 'Publicação de fluxo',
  ARQUIVAR: 'Arquivamento de fluxo',
  CLONAR: 'Clonagem de fluxo',
  CRIAR_FASE: 'Criação de fase',
  ALTERAR_FASE: 'Alteração de fase',
  REMOVER_FASE: 'Remoção de fase',
  CRIAR_ETAPA: 'Criação de etapa',
  ALTERAR_ETAPA: 'Alteração de etapa',
  REMOVER_ETAPA: 'Remoção de etapa',
  ENCERRAR: 'Encerramento',
  CANCELAR: 'Cancelamento',
  CONCLUIDO: 'Conclusão do processo',
  ANULADO: 'Anulação do processo',
  REVOGADO: 'Revogação do processo',
};

export const RECURSOS_AUDITORIA: Record<string, string> = {
  sessao: 'Sessão',
  usuario: 'Usuário',
  role: 'Papel',
  tipo_processo: 'Tipo de processo',
  processo: 'Processo',
  cargo: 'Cargo',
  fluxo: 'Fluxo',
  fase: 'Fase',
  etapa: 'Etapa',
  setor: 'Setor',
};

function humanizar(codigo: string): string {
  const texto = codigo.replace(/_/g, ' ').toLowerCase().trim();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function rotuloAcao(acao: string): string {
  return ACOES_AUDITORIA[acao] ?? humanizar(acao);
}

export function rotuloRecurso(recurso: string | null): string {
  if (!recurso) {
    return '—';
  }
  return RECURSOS_AUDITORIA[recurso] ?? humanizar(recurso);
}
