export interface Referencia {
  id: number;
  nome: string;
}

export interface ProcessoResumo {
  id: number;
  numero: string;
  nome: string;
  objeto: string;
  status: string;
  tipoProcesso: Referencia | null;
  setorAtual: Referencia | null;
  responsavelAtual: Referencia | null;
  etapaAtual: { id: number; nome: string; status: string } | null;
  criadoEm: string;
  iniciadoEm: string | null;
  finalizadoEm: string | null;
}

export interface ProcessoEtapa {
  id: number;
  sequencia: number;
  nome: string;
  faseNome: string | null;
  status: string;
  obrigatoria: boolean;
  prazoGestaoDias: number | null;
  dataInicio: string | null;
  dataPrevista: string | null;
  dataConclusao: string | null;
  motivoBloqueio: string | null;
  retornoParaEtapaId: number | null;
  responsavel: Referencia | null;
  setor: Referencia | null;
}

export interface Movimentacao {
  id: number;
  tipo: string;
  descricao: string | null;
  usuario: Referencia | null;
  setor: Referencia | null;
  metadados: Record<string, unknown> | null;
  criadoEm: string;
}

export interface ProcessoDetalhe extends ProcessoResumo {
  descricao: string | null;
  fluxo: { id: number; nome: string; versao: number } | null;
  etapas: ProcessoEtapa[];
  movimentacoes: Movimentacao[];
}

export interface EtapaFluxo {
  id: number;
  nome: string;
  ordem: number;
  obrigatoria: boolean;
  prazoGestaoDias: number | null;
  responsavelSetorId: number | null;
  responsavelCargoId: number | null;
  responsavelUsuarioId: number | null;
  descricao: string | null;
  requisitos: string | null;
  referenciaLegal: string | null;
  condicional: boolean;
  condicaoAplicabilidade: string | null;
}

export interface FaseFluxo {
  id: number;
  nome: string;
  ordem: number;
  descricao: string | null;
  etapas: EtapaFluxo[];
}

export interface FluxoDetalhe {
  id: number;
  tipoProcessoId: number;
  tipoProcessoNome: string | null;
  nome: string;
  descricao: string | null;
  versao: number;
  situacao: string;
  publicadoEm: string | null;
  fases: FaseFluxo[];
}

export interface FluxoResumo {
  id: number;
  tipoProcessoId: number;
  tipoProcessoNome: string | null;
  nome: string;
  versao: number;
  situacao: string;
  publicadoEm: string | null;
}

/** Fluxo publicado disponível para escolha na criação de processo. */
export interface FluxoDisponivel {
  id: number;
  nome: string;
  versao: number;
}

export interface Cargo {
  id: number;
  nome: string;
  nomeOriginal: string | null;
}

export interface Setor {
  id: number;
  nome: string;
  sigla: string | null;
  ativo: boolean;
}

export interface TipoProcesso {
  id: number;
  nome: string;
  descricao: string | null;
  baseLegal: string | null;
  ativo: boolean;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  cargo: Referencia | null;
  roles: string[];
}

/** Lista enxuta usada para selecionar responsáveis em processos e etapas. */
export interface UsuarioAtribuivel {
  id: number;
  nome: string;
  cargo: string | null;
}

export interface Permissao {
  id: number;
  codigo: string;
  descricao: string | null;
}

export interface Papel {
  id: number;
  nome: string;
  descricao: string | null;
  permissoes: Permissao[];
}

export interface ItemAuditoria {
  id: number;
  usuario: Referencia | null;
  acao: string;
  recurso: string | null;
  recursoId: string | null;
  resultado: string;
  justificativa: string | null;
  correlacaoId: string | null;
  ip: string | null;
  metadados: Record<string, unknown> | null;
  criadoEm: string;
}
