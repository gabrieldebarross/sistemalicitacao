import { sequelize } from '../config/database.js';
import {
  PROCESSO_ETAPA_STATUS,
  PROCESSO_STATUS,
  type MovimentacaoTipo,
  type ProcessoEtapaStatus,
  type ProcessoStatus,
} from '../domain/enums.js';
import { podeTransicionarProcesso } from '../domain/workflow.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../errors/app-error.js';
import type { Movimentacao } from '../models/movimentacao.js';
import type { Processo } from '../models/processo.js';
import type { ProcessoEtapa } from '../models/processo-etapa.js';
import * as fluxoRepo from '../repositories/fluxo.repository.js';
import * as movRepo from '../repositories/movimentacao.repository.js';
import * as processoRepo from '../repositories/processo.repository.js';
import * as tipoRepo from '../repositories/tipo-processo.repository.js';
import type { ContextoRequisicao } from '../types/context.js';
import { montarPaginado, type ResultadoPaginado } from '../utils/http.js';
import { resolverPaginacao } from '../utils/pagination.js';
import * as auditoria from './auditoria.service.js';

export interface ProcessoResumoDTO {
  id: number;
  numero: string;
  objeto: string;
  status: ProcessoStatus;
  tipoProcesso: { id: number; nome: string } | null;
  setorAtual: { id: number; nome: string } | null;
  responsavelAtual: { id: number; nome: string } | null;
  etapaAtual: { id: number; nome: string; status: ProcessoEtapaStatus } | null;
  criadoEm: Date;
  iniciadoEm: Date | null;
  finalizadoEm: Date | null;
}

export interface ProcessoEtapaDTO {
  id: number;
  sequencia: number;
  nome: string;
  faseNome: string | null;
  status: ProcessoEtapaStatus;
  obrigatoria: boolean;
  prazoGestaoDias: number | null;
  dataInicio: Date | null;
  dataPrevista: Date | null;
  dataConclusao: Date | null;
  motivoBloqueio: string | null;
  responsavel: { id: number; nome: string } | null;
  setor: { id: number; nome: string } | null;
}

export interface MovimentacaoDTO {
  id: number;
  tipo: MovimentacaoTipo;
  descricao: string | null;
  usuario: { id: number; nome: string } | null;
  setor: { id: number; nome: string } | null;
  metadados: Record<string, unknown> | null;
  criadoEm: Date;
}

export interface ProcessoDetalheDTO extends ProcessoResumoDTO {
  descricao: string | null;
  fluxo: { id: number; nome: string; versao: number } | null;
  etapas: ProcessoEtapaDTO[];
  movimentacoes: MovimentacaoDTO[];
}

function etapaAtualDe(processo: Processo): ProcessoEtapa | null {
  const etapas = processo.etapas ?? [];
  return (
    etapas.find((etapa) => etapa.id === processo.processoEtapaAtualId) ?? null
  );
}

function toResumo(processo: Processo): ProcessoResumoDTO {
  const atual = etapaAtualDe(processo);
  return {
    id: processo.id,
    numero: processo.numero,
    objeto: processo.objeto,
    status: processo.status,
    tipoProcesso: processo.tipoProcesso
      ? { id: processo.tipoProcesso.id, nome: processo.tipoProcesso.nome }
      : null,
    setorAtual: processo.setorAtual
      ? { id: processo.setorAtual.id, nome: processo.setorAtual.nome }
      : null,
    responsavelAtual: processo.responsavelAtual
      ? {
          id: processo.responsavelAtual.id,
          nome: processo.responsavelAtual.nome,
        }
      : null,
    etapaAtual: atual
      ? { id: atual.id, nome: atual.nome, status: atual.status }
      : null,
    criadoEm: processo.createdAt,
    iniciadoEm: processo.iniciadoEm,
    finalizadoEm: processo.finalizadoEm,
  };
}

function etapaToDTO(etapa: ProcessoEtapa): ProcessoEtapaDTO {
  return {
    id: etapa.id,
    sequencia: etapa.sequencia,
    nome: etapa.nome,
    faseNome: etapa.faseNome,
    status: etapa.status,
    obrigatoria: etapa.obrigatoria,
    prazoGestaoDias: etapa.prazoGestaoDias,
    dataInicio: etapa.dataInicio,
    dataPrevista: etapa.dataPrevista,
    dataConclusao: etapa.dataConclusao,
    motivoBloqueio: etapa.motivoBloqueio,
    responsavel: etapa.responsavel
      ? { id: etapa.responsavel.id, nome: etapa.responsavel.nome }
      : null,
    setor: etapa.setor ? { id: etapa.setor.id, nome: etapa.setor.nome } : null,
  };
}

function movimentacaoToDTO(mov: Movimentacao): MovimentacaoDTO {
  return {
    id: mov.id,
    tipo: mov.tipo,
    descricao: mov.descricao,
    usuario: mov.usuario
      ? { id: mov.usuario.id, nome: mov.usuario.nome }
      : null,
    setor: mov.setor ? { id: mov.setor.id, nome: mov.setor.nome } : null,
    metadados: mov.metadados,
    criadoEm: mov.createdAt,
  };
}

function toDetalhe(
  processo: Processo,
  movimentacoes: Movimentacao[],
): ProcessoDetalheDTO {
  const etapas = [...(processo.etapas ?? [])].sort(
    (a, b) => a.sequencia - b.sequencia,
  );
  return {
    ...toResumo(processo),
    descricao: processo.descricao,
    fluxo: processo.fluxo
      ? {
          id: processo.fluxo.id,
          nome: processo.fluxo.nome,
          versao: processo.fluxo.versao,
        }
      : null,
    etapas: etapas.map(etapaToDTO),
    movimentacoes: movimentacoes.map(movimentacaoToDTO),
  };
}

function calcularPrevista(base: Date, dias: number | null): Date | null {
  if (dias === null) {
    return null;
  }
  const prevista = new Date(base);
  prevista.setDate(prevista.getDate() + dias);
  return prevista;
}

function transicionar(processo: Processo, para: ProcessoStatus): void {
  if (!podeTransicionarProcesso(processo.status, para)) {
    throw new ConflictError(
      `Transição inválida: ${processo.status} → ${para}.`,
    );
  }
}

async function registrarMovimentacao(
  processo: Processo,
  processoEtapaId: number | null,
  tipo: MovimentacaoTipo,
  descricao: string | null,
  contexto: ContextoRequisicao,
  metadados: Record<string, unknown> | null = null,
): Promise<void> {
  await movRepo.criar({
    processoId: processo.id,
    processoEtapaId,
    usuarioId: contexto.usuarioId,
    setorId: processo.setorAtualId,
    tipo,
    descricao,
    metadados,
    correlacaoId: contexto.requestId,
  });
}

async function carregar(id: number): Promise<Processo> {
  const processo = await processoRepo.buscarPorId(id);
  if (!processo) {
    throw new NotFoundError('Processo não encontrado.');
  }
  return processo;
}

export async function listar(input: {
  status?: ProcessoStatus;
  tipoProcessoId?: number;
  setorAtualId?: number;
  responsavelAtualId?: number;
  busca?: string;
  pagina: number;
  tamanhoPagina: number;
}): Promise<ResultadoPaginado<ProcessoResumoDTO>> {
  const { offset, limit, pagina, tamanhoPagina } = resolverPaginacao(input);
  const filtro: processoRepo.FiltroProcesso = {};
  if (input.status !== undefined) {
    filtro.status = input.status;
  }
  if (input.tipoProcessoId !== undefined) {
    filtro.tipoProcessoId = input.tipoProcessoId;
  }
  if (input.setorAtualId !== undefined) {
    filtro.setorAtualId = input.setorAtualId;
  }
  if (input.responsavelAtualId !== undefined) {
    filtro.responsavelAtualId = input.responsavelAtualId;
  }
  if (input.busca) {
    filtro.busca = input.busca;
  }
  const { itens, total } = await processoRepo.listar(filtro, offset, limit);
  return montarPaginado(itens.map(toResumo), total, pagina, tamanhoPagina);
}

export async function detalhar(id: number): Promise<ProcessoDetalheDTO> {
  const processo = await carregar(id);
  const movimentacoes = await movRepo.listarPorProcesso(id);
  return toDetalhe(processo, movimentacoes);
}

export async function criar(
  input: {
    numero: string;
    objeto: string;
    descricao?: string;
    tipoProcessoId: number;
  },
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  const tipo = await tipoRepo.buscarPorId(input.tipoProcessoId);
  if (!tipo || !tipo.ativo) {
    throw new NotFoundError('Tipo de processo não encontrado ou inativo.');
  }
  const numero = input.numero.trim();
  if (await processoRepo.buscarPorNumero(numero)) {
    throw new ConflictError('Já existe um processo com este número.');
  }
  const publicado = await fluxoRepo.buscarPublicado(tipo.id);
  if (!publicado) {
    throw new ConflictError(
      'O tipo de processo não possui fluxo publicado. Publique um fluxo antes de criar processos.',
    );
  }
  const fluxo = await fluxoRepo.buscarPorId(publicado.id);
  if (!fluxo) {
    throw new ConflictError('Fluxo publicado não encontrado.');
  }

  const fases = [...(fluxo.fases ?? [])].sort((a, b) => a.ordem - b.ordem);
  const definicoes = fases.flatMap((fase) =>
    [...(fase.etapas ?? [])]
      .sort((a, b) => a.ordem - b.ordem)
      .map((etapa) => ({ fase, etapa })),
  );
  if (definicoes.length === 0) {
    throw new ConflictError('O fluxo publicado não possui etapas.');
  }

  const processo = await sequelize.transaction(async (transaction) => {
    const criado = await processoRepo.criar(
      {
        numero,
        objeto: input.objeto.trim(),
        descricao: input.descricao?.trim() || null,
        tipoProcessoId: tipo.id,
        fluxoId: fluxo.id,
        criadoPorId: contexto.usuarioId,
      },
      transaction,
    );

    const etapas = definicoes.map(({ fase, etapa }, indice) => ({
      processoId: criado.id,
      etapaId: etapa.id,
      sequencia: indice + 1,
      nome: etapa.nome,
      faseNome: fase.nome,
      obrigatoria: etapa.obrigatoria,
      prazoGestaoDias: etapa.prazoGestaoDias,
      responsavelId: etapa.responsavelUsuarioId,
      setorId: etapa.responsavelSetorId,
      status: PROCESSO_ETAPA_STATUS.PENDENTE,
    }));
    const criadas = await processoRepo.criarEtapasEmLote(etapas, transaction);
    const primeira = criadas[0];

    await processoRepo.atualizar(
      criado,
      {
        setorAtualId: primeira?.setorId ?? null,
        processoEtapaAtualId: primeira?.id ?? null,
      },
      transaction,
    );

    await movRepo.criar(
      {
        processoId: criado.id,
        processoEtapaId: null,
        usuarioId: contexto.usuarioId,
        setorId: primeira?.setorId ?? null,
        tipo: 'CRIACAO',
        descricao: 'Processo criado.',
        metadados: { fluxoId: fluxo.id, versao: fluxo.versao },
        correlacaoId: contexto.requestId,
      },
      transaction,
    );

    return criado;
  });

  await auditoria.registrar(contexto, {
    acao: 'CRIAR',
    recurso: 'processo',
    recursoId: processo.id,
    metadados: { numero: processo.numero, tipoProcessoId: tipo.id },
  });

  return detalhar(processo.id);
}

export async function atualizarDados(
  id: number,
  input: { objeto?: string; descricao?: string | null },
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  const processo = await carregar(id);
  if (
    processo.status === PROCESSO_STATUS.CONCLUIDO ||
    processo.status === PROCESSO_STATUS.ANULADO ||
    processo.status === PROCESSO_STATUS.REVOGADO
  ) {
    throw new ConflictError(
      'Processo encerrado não pode ter os dados alterados.',
    );
  }
  if (input.objeto !== undefined) {
    processo.objeto = input.objeto.trim();
  }
  if (input.descricao !== undefined) {
    processo.descricao = input.descricao;
  }
  await processo.save();
  await auditoria.registrar(contexto, {
    acao: 'ALTERAR',
    recurso: 'processo',
    recursoId: id,
  });
  return detalhar(id);
}

export async function iniciar(
  id: number,
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  const processo = await carregar(id);
  if (processo.status !== PROCESSO_STATUS.RASCUNHO) {
    throw new ConflictError('Somente processos em rascunho podem ser iniciados.');
  }
  const etapas = [...(processo.etapas ?? [])].sort(
    (a, b) => a.sequencia - b.sequencia,
  );
  const primeira = etapas[0];
  if (!primeira) {
    throw new ConflictError('O processo não possui etapas.');
  }
  const agora = new Date();
  primeira.status = PROCESSO_ETAPA_STATUS.EM_ANDAMENTO;
  primeira.dataInicio = agora;
  primeira.dataPrevista = calcularPrevista(agora, primeira.prazoGestaoDias);
  await primeira.save();

  await processoRepo.atualizar(processo, {
    status: PROCESSO_STATUS.EM_ANDAMENTO,
    iniciadoEm: agora,
    processoEtapaAtualId: primeira.id,
    setorAtualId: primeira.setorId,
    responsavelAtualId: primeira.responsavelId,
  });

  await registrarMovimentacao(
    processo,
    primeira.id,
    'INICIO_ETAPA',
    'Processo iniciado.',
    contexto,
  );
  await auditoria.registrar(contexto, {
    acao: 'INICIAR',
    recurso: 'processo',
    recursoId: id,
  });
  return detalhar(id);
}

export async function concluirEtapa(
  processoId: number,
  etapaId: number,
  input: { parecer?: string },
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  const processo = await carregar(processoId);
  if (processo.status !== PROCESSO_STATUS.EM_ANDAMENTO) {
    throw new ConflictError(
      'Somente processos em andamento podem avançar etapas.',
    );
  }
  const etapas = [...(processo.etapas ?? [])];
  const atual = etapas.find((etapa) => etapa.id === etapaId);
  if (!atual) {
    throw new NotFoundError('Etapa do processo não encontrada.');
  }
  if (atual.status !== PROCESSO_ETAPA_STATUS.EM_ANDAMENTO) {
    throw new ConflictError('A etapa não está em andamento.');
  }

  const agora = new Date();
  atual.status = PROCESSO_ETAPA_STATUS.CONCLUIDA;
  atual.dataConclusao = agora;
  await atual.save();

  const proxima = etapas
    .filter(
      (etapa) =>
        etapa.sequencia > atual.sequencia &&
        etapa.status !== PROCESSO_ETAPA_STATUS.CONCLUIDA &&
        etapa.status !== PROCESSO_ETAPA_STATUS.PULADA,
    )
    .sort((a, b) => a.sequencia - b.sequencia)[0];

  if (proxima) {
    proxima.status = PROCESSO_ETAPA_STATUS.EM_ANDAMENTO;
    proxima.dataInicio = agora;
    proxima.dataPrevista = calcularPrevista(agora, proxima.prazoGestaoDias);
    await proxima.save();
    await processoRepo.atualizar(processo, {
      processoEtapaAtualId: proxima.id,
      setorAtualId: proxima.setorId,
      responsavelAtualId: proxima.responsavelId,
    });
  } else {
    // A última etapa foi concluída, mas a conclusão do processo é uma decisão
    // explícita (permissão processos.conclude), separada do avanço de etapas.
    await processoRepo.atualizar(processo, {
      processoEtapaAtualId: null,
      setorAtualId: null,
      responsavelAtualId: null,
    });
  }

  await registrarMovimentacao(
    processo,
    atual.id,
    'CONCLUSAO_ETAPA',
    input.parecer?.trim() || `Etapa "${atual.nome}" concluída.`,
    contexto,
  );
  if (proxima) {
    await registrarMovimentacao(
      processo,
      proxima.id,
      'ENCAMINHAMENTO',
      `Encaminhado para a etapa "${proxima.nome}".`,
      contexto,
    );
  } else {
    await registrarMovimentacao(
      processo,
      atual.id,
      'ENCAMINHAMENTO',
      'Todas as etapas foram concluídas. O processo aguarda a conclusão.',
      contexto,
    );
  }
  await auditoria.registrar(contexto, {
    acao: 'CONCLUIR_ETAPA',
    recurso: 'processo',
    recursoId: processoId,
    metadados: { etapaId },
  });
  return detalhar(processoId);
}

export async function devolverEtapa(
  processoId: number,
  etapaId: number,
  input: { motivo: string; paraEtapaId?: number },
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  const processo = await carregar(processoId);
  if (processo.status !== PROCESSO_STATUS.EM_ANDAMENTO) {
    throw new ConflictError(
      'Somente processos em andamento podem ter etapas devolvidas.',
    );
  }
  const etapas = [...(processo.etapas ?? [])];
  const atual = etapas.find((etapa) => etapa.id === etapaId);
  if (!atual) {
    throw new NotFoundError('Etapa do processo não encontrada.');
  }
  if (atual.status !== PROCESSO_ETAPA_STATUS.EM_ANDAMENTO) {
    throw new ConflictError('A etapa não está em andamento.');
  }

  const alvo = input.paraEtapaId
    ? etapas.find((etapa) => etapa.id === input.paraEtapaId)
    : etapas
        .filter(
          (etapa) =>
            etapa.sequencia < atual.sequencia &&
            etapa.status === PROCESSO_ETAPA_STATUS.CONCLUIDA,
        )
        .sort((a, b) => b.sequencia - a.sequencia)[0];

  if (!alvo) {
    throw new ConflictError('Não há etapa concluída para devolver.');
  }
  if (alvo.sequencia >= atual.sequencia) {
    throw new ValidationError('A etapa de destino deve ser anterior à atual.');
  }
  if (alvo.status !== PROCESSO_ETAPA_STATUS.CONCLUIDA) {
    throw new ConflictError('A etapa de destino não está concluída.');
  }

  // Reabre as etapas intermediárias concluídas.
  for (const etapa of etapas) {
    if (
      etapa.sequencia > alvo.sequencia &&
      etapa.sequencia < atual.sequencia &&
      etapa.status === PROCESSO_ETAPA_STATUS.CONCLUIDA
    ) {
      etapa.status = PROCESSO_ETAPA_STATUS.PENDENTE;
      etapa.dataConclusao = null;
      await etapa.save();
    }
  }

  alvo.status = PROCESSO_ETAPA_STATUS.EM_ANDAMENTO;
  alvo.dataConclusao = null;
  await alvo.save();

  atual.status = PROCESSO_ETAPA_STATUS.PENDENTE;
  atual.dataInicio = null;
  atual.dataConclusao = null;
  await atual.save();

  await processoRepo.atualizar(processo, {
    processoEtapaAtualId: alvo.id,
    setorAtualId: alvo.setorId,
    responsavelAtualId: alvo.responsavelId,
  });

  await registrarMovimentacao(
    processo,
    alvo.id,
    'DEVOLUCAO',
    `Devolvido da etapa "${atual.nome}" para a etapa "${alvo.nome}". Motivo: ${input.motivo.trim()}`,
    contexto,
    {
      etapaOrigemId: atual.id,
      etapaOrigemNome: atual.nome,
      etapaDestinoId: alvo.id,
      etapaDestinoNome: alvo.nome,
    },
  );
  await auditoria.registrar(contexto, {
    acao: 'DEVOLVER_ETAPA',
    recurso: 'processo',
    recursoId: processoId,
    justificativa: input.motivo,
    metadados: { etapaId, paraEtapaId: alvo.id },
  });
  return detalhar(processoId);
}

export async function atribuir(
  id: number,
  input: { responsavelAtualId?: number | null; setorAtualId?: number | null },
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  if (
    input.responsavelAtualId === undefined &&
    input.setorAtualId === undefined
  ) {
    throw new ValidationError('Informe responsável e/ou setor.');
  }
  const processo = await carregar(id);
  if (
    processo.status === PROCESSO_STATUS.CONCLUIDO ||
    processo.status === PROCESSO_STATUS.ANULADO ||
    processo.status === PROCESSO_STATUS.REVOGADO
  ) {
    throw new ConflictError('Processo encerrado não pode ser reatribuído.');
  }
  if (input.responsavelAtualId !== undefined) {
    processo.responsavelAtualId = input.responsavelAtualId;
  }
  if (input.setorAtualId !== undefined) {
    processo.setorAtualId = input.setorAtualId;
  }
  await processo.save();

  const atual = etapaAtualDe(processo);
  if (atual) {
    if (input.responsavelAtualId !== undefined) {
      atual.responsavelId = input.responsavelAtualId;
    }
    if (input.setorAtualId !== undefined) {
      atual.setorId = input.setorAtualId;
    }
    await atual.save();
  }

  await registrarMovimentacao(
    processo,
    atual?.id ?? null,
    'ENCAMINHAMENTO',
    'Responsável/setor atualizado.',
    contexto,
  );
  await auditoria.registrar(contexto, {
    acao: 'ATRIBUIR',
    recurso: 'processo',
    recursoId: id,
    metadados: {
      responsavelAtualId: input.responsavelAtualId ?? null,
      setorAtualId: input.setorAtualId ?? null,
    },
  });
  return detalhar(id);
}

export async function suspender(
  id: number,
  justificativa: string,
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  const processo = await carregar(id);
  transicionar(processo, PROCESSO_STATUS.SUSPENSO);
  await processoRepo.atualizar(processo, { status: PROCESSO_STATUS.SUSPENSO });
  await registrarMovimentacao(
    processo,
    processo.processoEtapaAtualId,
    'SUSPENSAO',
    justificativa.trim(),
    contexto,
  );
  await auditoria.registrar(contexto, {
    acao: 'SUSPENDER',
    recurso: 'processo',
    recursoId: id,
    justificativa,
  });
  return detalhar(id);
}

export async function retomar(
  id: number,
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  const processo = await carregar(id);
  transicionar(processo, PROCESSO_STATUS.EM_ANDAMENTO);
  await processoRepo.atualizar(processo, {
    status: PROCESSO_STATUS.EM_ANDAMENTO,
  });
  await registrarMovimentacao(
    processo,
    processo.processoEtapaAtualId,
    'RETOMADA',
    'Processo retomado.',
    contexto,
  );
  await auditoria.registrar(contexto, {
    acao: 'RETOMAR',
    recurso: 'processo',
    recursoId: id,
  });
  return detalhar(id);
}

export async function encerrar(
  id: number,
  status: 'ANULADO' | 'REVOGADO' | 'CONCLUIDO',
  justificativa: string,
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  const processo = await carregar(id);
  transicionar(processo, status);
  const agora = new Date();
  const etapaAtualId = processo.processoEtapaAtualId;
  await processoRepo.atualizar(processo, {
    status,
    finalizadoEm: agora,
    processoEtapaAtualId: null,
    responsavelAtualId: null,
  });
  await registrarMovimentacao(
    processo,
    etapaAtualId,
    status === 'CONCLUIDO' ? 'CONCLUSAO_PROCESSO' : 'ALTERACAO',
    justificativa.trim(),
    contexto,
  );
  await auditoria.registrar(contexto, {
    acao: status,
    recurso: 'processo',
    recursoId: id,
    justificativa,
  });
  return detalhar(id);
}

export async function movimentacoes(
  id: number,
): Promise<MovimentacaoDTO[]> {
  await carregar(id);
  const movs = await movRepo.listarPorProcesso(id);
  return movs.map(movimentacaoToDTO);
}
