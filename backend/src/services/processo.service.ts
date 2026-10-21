import type { Transaction } from 'sequelize';

import { sequelize } from '../config/database.js';
import {
  PROCESSO_ETAPA_STATUS,
  PROCESSO_STATUS,
  type MovimentacaoTipo,
  type ProcessoEtapaStatus,
  type ProcessoStatus,
} from '../domain/enums.js';
import {
  classificarPendenciasConclusao,
  etapaPodeSerPulada,
  podeTransicionarEtapa,
  podeTransicionarProcesso,
  proximaEtapaAposConclusao,
  proximaEtapaPendente,
} from '../domain/workflow.js';
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
import * as setorRepo from '../repositories/setor.repository.js';
import * as tipoRepo from '../repositories/tipo-processo.repository.js';
import * as usuarioRepo from '../repositories/usuario.repository.js';
import type { ContextoRequisicao } from '../types/context.js';
import { diffAuditoria } from '../utils/audit-diff.js';
import { montarPaginado, type ResultadoPaginado } from '../utils/http.js';
import { resolverPaginacao } from '../utils/pagination.js';
import * as auditoria from './auditoria.service.js';

export interface ProcessoResumoDTO {
  id: number;
  numero: string;
  nome: string;
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
  retornoParaEtapaId: number | null;
  condicional: boolean;
  condicaoAplicabilidade: string | null;
  permitePulo: boolean;
  motivoPulo: string | null;
  puladaEm: Date | null;
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

export interface EtapaCondicionalDisponivelDTO {
  id: number;
  nome: string;
  sequencia: number;
  faseNome: string | null;
  condicaoAplicabilidade: string | null;
}

export interface FluxoDisponivelDTO {
  id: number;
  nome: string;
  versao: number;
  etapasCondicionais: EtapaCondicionalDisponivelDTO[];
}

function etapaAtualDe(processo: Processo): ProcessoEtapa | null {
  const etapas = processo.etapas ?? [];
  return (
    etapas.find((etapa) => etapa.id === processo.processoEtapaAtualId) ?? null
  );
}

function toResumo(processo: Processo): ProcessoResumoDTO {
  const atual = processo.etapaAtual ?? etapaAtualDe(processo);
  return {
    id: processo.id,
    numero: processo.numero,
    nome: processo.nome,
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
    retornoParaEtapaId: etapa.retornoParaEtapaId,
    condicional: etapa.condicional,
    condicaoAplicabilidade: etapa.condicaoAplicabilidade,
    permitePulo: etapa.permitePulo,
    motivoPulo: etapa.motivoPulo,
    puladaEm: etapa.puladaEm,
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

/** Identificação legível do processo para a trilha de auditoria. */
function identificarProcesso(processo: Processo): {
  nome: string;
  numero: string;
} {
  return { nome: processo.nome, numero: processo.numero };
}

async function registrarMovimentacao(
  processo: Processo,
  processoEtapaId: number | null,
  tipo: MovimentacaoTipo,
  descricao: string | null,
  contexto: ContextoRequisicao,
  metadados: Record<string, unknown> | null = null,
  transaction?: Transaction,
): Promise<void> {
  await movRepo.criar(
    {
      processoId: processo.id,
      processoEtapaId,
      usuarioId: contexto.usuarioId,
      setorId: processo.setorAtualId,
      tipo,
      descricao,
      metadados,
      correlacaoId: contexto.requestId,
    },
    transaction,
  );
}

async function carregar(id: number): Promise<Processo> {
  const processo = await processoRepo.buscarPorId(id);
  if (!processo) {
    throw new NotFoundError('Processo não encontrado.');
  }
  return processo;
}

async function carregarComLock(
  id: number,
  transaction: Transaction,
): Promise<Processo> {
  const processo = await processoRepo.buscarPorIdComLock(id, transaction);
  if (!processo) {
    throw new NotFoundError('Processo não encontrado.');
  }
  return processo;
}

function exigirProcessoEmAndamento(processo: Processo): void {
  if (processo.status !== PROCESSO_STATUS.EM_ANDAMENTO) {
    throw new ConflictError(
      'A operação só está disponível para processos em andamento.',
    );
  }
}

function localizarEtapa(processo: Processo, etapaId: number): ProcessoEtapa {
  const etapa = (processo.etapas ?? []).find((item) => item.id === etapaId);
  if (!etapa) {
    throw new NotFoundError('Etapa do processo não encontrada.');
  }
  return etapa;
}

/**
 * Ativa a próxima etapa não finalizada. Usado na conclusão e no pulo da etapa
 * atual. Quando não há próxima, o processo aguarda a conclusão explícita.
 */
async function ativarProximaEtapa(
  processo: Processo,
  etapaAtual: ProcessoEtapa,
  transaction: Transaction,
): Promise<ProcessoEtapa | undefined> {
  const etapas = processo.etapas ?? [];
  const proxima = proximaEtapaAposConclusao(etapas, etapaAtual);
  const agora = new Date();
  if (proxima) {
    proxima.status = PROCESSO_ETAPA_STATUS.EM_ANDAMENTO;
    proxima.dataInicio = agora;
    proxima.dataPrevista = calcularPrevista(agora, proxima.prazoGestaoDias);
    await proxima.save({ transaction });
    await processoRepo.atualizar(
      processo,
      {
        processoEtapaAtualId: proxima.id,
        setorAtualId: proxima.setorId,
        responsavelAtualId: proxima.responsavelId,
      },
      transaction,
    );
    return proxima;
  }
  await processoRepo.atualizar(
    processo,
    {
      processoEtapaAtualId: null,
      setorAtualId: null,
      responsavelAtualId: null,
    },
    transaction,
  );
  return undefined;
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

/**
 * Fluxos publicados de um tipo, usados na escolha explícita ao criar processo.
 * Exige apenas a permissão de criação de processo, não a de leitura de fluxos.
 */
export async function fluxosDisponiveis(
  tipoProcessoId: number,
): Promise<FluxoDisponivelDTO[]> {
  const tipo = await tipoRepo.buscarPorId(tipoProcessoId);
  if (!tipo || !tipo.ativo) {
    throw new NotFoundError('Tipo de processo não encontrado ou inativo.');
  }
  const fluxos =
    await fluxoRepo.listarPublicadosComEtapas(tipoProcessoId);
  return fluxos.map((fluxo) => {
    const etapas = [...(fluxo.fases ?? [])]
      .sort((a, b) => a.ordem - b.ordem)
      .flatMap((fase) =>
        [...(fase.etapas ?? [])]
          .sort((a, b) => a.ordem - b.ordem)
          .map((etapa) => ({ etapa, faseNome: fase.nome })),
      )
      .map(({ etapa, faseNome }, indice) => ({
        etapa,
        faseNome,
        sequencia: indice + 1,
      }))
      .filter(({ etapa }) => etapa.condicional)
      .map(({ etapa, faseNome, sequencia }) => ({
        id: etapa.id,
        nome: etapa.nome,
        sequencia,
        faseNome,
        condicaoAplicabilidade: etapa.condicaoAplicabilidade,
      }));
    return {
      id: fluxo.id,
      nome: fluxo.nome,
      versao: fluxo.versao,
      etapasCondicionais: etapas,
    };
  });
}

export async function detalhar(id: number): Promise<ProcessoDetalheDTO> {
  const processo = await carregar(id);
  const movimentacoes = await movRepo.listarPorProcesso(id);
  return toDetalhe(processo, movimentacoes);
}

export async function criar(
  input: {
    numero: string;
    nome?: string;
    objeto: string;
    descricao?: string;
    tipoProcessoId: number;
    fluxoId?: number;
    etapasCondicionais?: Array<{
      etapaId: number;
      aplicavel: boolean;
      justificativa?: string;
    }>;
  },
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  const tipo = await tipoRepo.buscarPorId(input.tipoProcessoId);
  if (!tipo || !tipo.ativo) {
    throw new NotFoundError('Tipo de processo não encontrado ou inativo.');
  }
  const numero = input.numero.trim();
  const nome = input.nome?.trim() || numero;
  if (await processoRepo.buscarPorNumero(numero)) {
    throw new ConflictError('Já existe um processo com este número.');
  }

  let fluxo;
  if (input.fluxoId !== undefined) {
    fluxo = await fluxoRepo.buscarPorId(input.fluxoId);
    if (!fluxo) {
      throw new NotFoundError('Fluxo de trabalho não encontrado.');
    }
    if (fluxo.tipoProcessoId !== tipo.id) {
      throw new ValidationError(
        'O fluxo escolhido não pertence ao tipo de processo informado.',
      );
    }
    if (fluxo.situacao !== 'PUBLICADO') {
      throw new ConflictError(
        'Somente fluxos publicados podem ser usados para criar processos.',
      );
    }
  } else {
    const publicado = await fluxoRepo.buscarPublicado(tipo.id);
    if (!publicado) {
      throw new ConflictError(
        'O tipo de processo não possui fluxo publicado. Publique um fluxo antes de criar processos.',
      );
    }
    fluxo = await fluxoRepo.buscarPorId(publicado.id);
    if (!fluxo) {
      throw new ConflictError('Fluxo publicado não encontrado.');
    }
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

  const selecoes = input.etapasCondicionais ?? [];
  const idsSelecionados = new Set<number>();
  const selecaoPorEtapa = new Map<
    number,
    { aplicavel: boolean; justificativa: string | null }
  >();
  for (const selecao of selecoes) {
    if (idsSelecionados.has(selecao.etapaId)) {
      throw new ValidationError(
        `A etapa ${selecao.etapaId} foi informada mais de uma vez.`,
      );
    }
    idsSelecionados.add(selecao.etapaId);
    const definicao = definicoes.find(
      ({ etapa }) => etapa.id === selecao.etapaId,
    );
    if (!definicao) {
      throw new ValidationError(
        'Foi informada uma etapa condicional que não pertence ao fluxo escolhido.',
      );
    }
    if (!definicao.etapa.condicional) {
      throw new ValidationError(
        `A etapa "${definicao.etapa.nome}" não é condicional.`,
      );
    }
    const justificativa = selecao.justificativa?.trim() || null;
    if (!selecao.aplicavel && (!justificativa || justificativa.length < 5)) {
      throw new ValidationError(
        `Informe a justificativa para a etapa não aplicável "${definicao.etapa.nome}".`,
      );
    }
    selecaoPorEtapa.set(selecao.etapaId, {
      aplicavel: selecao.aplicavel,
      justificativa,
    });
  }
  for (const { etapa } of definicoes) {
    if (etapa.condicional && !selecaoPorEtapa.has(etapa.id)) {
      throw new ValidationError(
        `Selecione se a etapa condicional "${etapa.nome}" é aplicável.`,
      );
    }
  }

  const agora = new Date();
  const processo = await sequelize.transaction(async (transaction) => {
    const criado = await processoRepo.criar(
      {
        numero,
        nome,
        objeto: input.objeto.trim(),
        descricao: input.descricao?.trim() || null,
        tipoProcessoId: tipo.id,
        fluxoId: fluxo.id,
        criadoPorId: contexto.usuarioId,
      },
      transaction,
    );

    const etapas = definicoes.map(({ fase, etapa }, indice) => {
      const selecao = selecaoPorEtapa.get(etapa.id);
      const naoAplicavel = selecao?.aplicavel === false;
      return {
        processoId: criado.id,
        etapaId: etapa.id,
        sequencia: indice + 1,
        nome: etapa.nome,
        faseNome: fase.nome,
        obrigatoria: etapa.obrigatoria,
        prazoGestaoDias: etapa.prazoGestaoDias,
        responsavelId: etapa.responsavelUsuarioId,
        setorId: etapa.responsavelSetorId,
        status: naoAplicavel
          ? PROCESSO_ETAPA_STATUS.PULADA
          : PROCESSO_ETAPA_STATUS.PENDENTE,
        condicional: etapa.condicional,
        condicaoAplicabilidade: etapa.condicaoAplicabilidade,
        permitePulo: etapa.permitePulo,
        motivoPulo: naoAplicavel ? selecao.justificativa : null,
        puladaEm: naoAplicavel ? agora : null,
      };
    });
    const criadas = await processoRepo.criarEtapasEmLote(etapas, transaction);
    const primeira = proximaEtapaPendente(criadas);
    if (!primeira) {
      throw new ValidationError(
        'Ao menos uma etapa do fluxo deve ser aplicável ao processo.',
      );
    }

    await processoRepo.atualizar(
      criado,
      {
        setorAtualId: primeira.setorId,
        processoEtapaAtualId: primeira.id,
      },
      transaction,
    );

    const etapasPuladas = criadas.filter(
      (etapa) => etapa.status === PROCESSO_ETAPA_STATUS.PULADA,
    );
    for (const etapa of etapasPuladas) {
      await movRepo.criar(
        {
          processoId: criado.id,
          processoEtapaId: etapa.id,
          usuarioId: contexto.usuarioId,
          setorId: etapa.setorId,
          tipo: 'PULO_ETAPA',
          descricao: etapa.motivoPulo
            ? `Etapa "${etapa.nome}" não aplicável. ${etapa.motivoPulo}`
            : `Etapa "${etapa.nome}" não aplicável.`,
          metadados: {
            etapaId: etapa.id,
            etapaNome: etapa.nome,
            origem: 'CRIACAO',
            motivoPulo: etapa.motivoPulo,
          },
          correlacaoId: contexto.requestId,
        },
        transaction,
      );
    }

    await movRepo.criar(
      {
        processoId: criado.id,
        processoEtapaId: null,
        usuarioId: contexto.usuarioId,
        setorId: primeira.setorId,
        tipo: 'CRIACAO',
        descricao: 'Processo criado.',
        metadados: {
          fluxoId: fluxo.id,
          versao: fluxo.versao,
          etapasCondicionais: selecoes.map((selecao) => ({
            etapaId: selecao.etapaId,
            aplicavel: selecao.aplicavel,
          })),
          etapasPuladas: etapasPuladas.map((etapa) => etapa.id),
        },
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
    metadados: {
      nome: processo.nome,
      numero: processo.numero,
      tipoProcessoId: tipo.id,
      etapasCondicionais: selecoes.map((selecao) => ({
        etapaId: selecao.etapaId,
        aplicavel: selecao.aplicavel,
        justificativa: selecao.justificativa ?? null,
      })),
    },
  });

  return detalhar(processo.id);
}

export async function atualizarDados(
  id: number,
  input: { nome?: string; objeto?: string; descricao?: string | null },
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
  const antes = {
    nome: processo.nome,
    objeto: processo.objeto,
    descricao: processo.descricao,
  };
  if (input.nome !== undefined) {
    processo.nome = input.nome.trim();
  }
  if (input.objeto !== undefined) {
    processo.objeto = input.objeto.trim();
  }
  if (input.descricao !== undefined) {
    processo.descricao = input.descricao;
  }
  await processo.save();
  const alteracoes = diffAuditoria(
    antes,
    {
      nome: processo.nome,
      objeto: processo.objeto,
      descricao: processo.descricao,
    },
    ['nome', 'objeto', 'descricao'],
  );
  await auditoria.registrar(contexto, {
    acao: 'ALTERAR',
    recurso: 'processo',
    recursoId: id,
    metadados: {
      ...identificarProcesso(processo),
      alteracoes,
    },
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
  const primeira = proximaEtapaPendente(etapas);
  if (!primeira) {
    throw new ConflictError('O processo não possui etapas aplicáveis.');
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
    metadados: {
      ...identificarProcesso(processo),
      etapaId: primeira.id,
      etapaNome: primeira.nome,
    },
  });
  return detalhar(id);
}

export async function concluirEtapa(
  processoId: number,
  etapaId: number,
  input: { parecer?: string },
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  let eventoAuditoria:
    | {
        processo: { nome: string; numero: string };
        etapaNome: string;
        proximaId: number | null;
        proximaNome: string | null;
        alteracoes: Record<string, unknown>;
      }
    | undefined;

  await sequelize.transaction(async (transaction) => {
    const processo = await carregarComLock(processoId, transaction);
    exigirProcessoEmAndamento(processo);
    const etapas = [...(processo.etapas ?? [])];
    const atual = localizarEtapa(processo, etapaId);
    if (atual.status !== PROCESSO_ETAPA_STATUS.EM_ANDAMENTO) {
      throw new ConflictError(
        'Somente etapas em andamento podem ser concluídas.',
      );
    }

    const agora = new Date();
    const retornoId = atual.retornoParaEtapaId;
    const antes = {
      status: atual.status,
      dataConclusao: atual.dataConclusao,
      retornoParaEtapaId: atual.retornoParaEtapaId,
    };
    // Se esta etapa havia sido devolvida, ao concluí-la o fluxo retorna
    // diretamente para a etapa que originou a devolução. Caso contrário, segue
    // a ordem linear.
    const proxima = proximaEtapaAposConclusao(etapas, atual);
    atual.status = PROCESSO_ETAPA_STATUS.CONCLUIDA;
    atual.dataConclusao = agora;
    atual.retornoParaEtapaId = null;
    await atual.save({ transaction });
    const alteracoes = diffAuditoria(
      antes,
      {
        status: atual.status,
        dataConclusao: atual.dataConclusao,
        retornoParaEtapaId: atual.retornoParaEtapaId,
      },
      ['status', 'dataConclusao', 'retornoParaEtapaId'],
    );

    const retorno =
      retornoId && proxima?.id === retornoId ? proxima : undefined;

    if (proxima) {
      proxima.status = PROCESSO_ETAPA_STATUS.EM_ANDAMENTO;
      proxima.dataInicio = agora;
      proxima.dataPrevista = calcularPrevista(
        agora,
        proxima.prazoGestaoDias,
      );
      await proxima.save({ transaction });
      await processoRepo.atualizar(
        processo,
        {
          processoEtapaAtualId: proxima.id,
          setorAtualId: proxima.setorId,
          responsavelAtualId: proxima.responsavelId,
        },
        transaction,
      );
    } else {
      // A última etapa foi concluída, mas a conclusão do processo é uma decisão
      // explícita (permissão processos.conclude), separada do avanço de etapas.
      await processoRepo.atualizar(
        processo,
        {
          processoEtapaAtualId: null,
          setorAtualId: null,
          responsavelAtualId: null,
        },
        transaction,
      );
    }

    await registrarMovimentacao(
      processo,
      atual.id,
      'CONCLUSAO_ETAPA',
      input.parecer?.trim() || `Etapa "${atual.nome}" concluída.`,
      contexto,
      { alteracoes },
      transaction,
    );
    if (proxima) {
      await registrarMovimentacao(
        processo,
        proxima.id,
        'ENCAMINHAMENTO',
        retorno && proxima.id === retorno.id
          ? `Devolução cumprida. Retornado para a etapa "${proxima.nome}".`
          : `Encaminhado para a etapa "${proxima.nome}".`,
        contexto,
        null,
        transaction,
      );
    } else {
      await registrarMovimentacao(
        processo,
        atual.id,
        'ENCAMINHAMENTO',
        'Todas as etapas foram concluídas. O processo aguarda a conclusão.',
        contexto,
        null,
        transaction,
      );
    }

    eventoAuditoria = {
      processo: identificarProcesso(processo),
      etapaNome: atual.nome,
      proximaId: proxima?.id ?? null,
      proximaNome: proxima?.nome ?? null,
      alteracoes,
    };
  });

  if (eventoAuditoria) {
    await auditoria.registrar(contexto, {
      acao: 'CONCLUIR_ETAPA',
      recurso: 'processo',
      recursoId: processoId,
      metadados: {
        ...eventoAuditoria.processo,
        etapaId,
        etapaNome: eventoAuditoria.etapaNome,
        proximaEtapaId: eventoAuditoria.proximaId,
        proximaEtapaNome: eventoAuditoria.proximaNome,
        alteracoes: eventoAuditoria.alteracoes,
      },
    });
  }
  return detalhar(processoId);
}

export async function devolverEtapa(
  processoId: number,
  etapaId: number,
  input: { motivo: string; paraEtapaId?: number },
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  let eventoAuditoria:
    | {
        processo: { nome: string; numero: string };
        etapaNome: string;
        alvoId: number;
        alvoNome: string;
        alteracoes: Record<string, unknown>;
      }
    | undefined;

  await sequelize.transaction(async (transaction) => {
    const processo = await carregarComLock(processoId, transaction);
    exigirProcessoEmAndamento(processo);
    const etapas = [...(processo.etapas ?? [])];
    const atual = localizarEtapa(processo, etapaId);
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

    const agora = new Date();
    const antesAlvo = {
      status: alvo.status,
      dataInicio: alvo.dataInicio,
      dataPrevista: alvo.dataPrevista,
      dataConclusao: alvo.dataConclusao,
      retornoParaEtapaId: alvo.retornoParaEtapaId,
    };
    const antesAtual = {
      status: atual.status,
      dataInicio: atual.dataInicio,
      dataPrevista: atual.dataPrevista,
      dataConclusao: atual.dataConclusao,
      retornoParaEtapaId: atual.retornoParaEtapaId,
    };

    // A etapa de destino volta a andar. As etapas intermediárias permanecem
    // concluídas: ao concluir o destino, o processo retorna diretamente para a
    // etapa que originou a devolução.
    alvo.status = PROCESSO_ETAPA_STATUS.EM_ANDAMENTO;
    alvo.dataInicio = agora;
    alvo.dataPrevista = calcularPrevista(agora, alvo.prazoGestaoDias);
    alvo.dataConclusao = null;
    alvo.retornoParaEtapaId = atual.id;
    await alvo.save({ transaction });

    atual.status = PROCESSO_ETAPA_STATUS.PENDENTE;
    atual.dataInicio = null;
    atual.dataPrevista = null;
    atual.dataConclusao = null;
    atual.retornoParaEtapaId = null;
    await atual.save({ transaction });

    await processoRepo.atualizar(
      processo,
      {
        processoEtapaAtualId: alvo.id,
        setorAtualId: alvo.setorId,
        responsavelAtualId: alvo.responsavelId,
      },
      transaction,
    );

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
      transaction,
    );

    eventoAuditoria = {
      processo: identificarProcesso(processo),
      etapaNome: atual.nome,
      alvoId: alvo.id,
      alvoNome: alvo.nome,
      alteracoes: {
        destino: diffAuditoria(
          antesAlvo,
          {
            status: alvo.status,
            dataInicio: alvo.dataInicio,
            dataPrevista: alvo.dataPrevista,
            dataConclusao: alvo.dataConclusao,
            retornoParaEtapaId: alvo.retornoParaEtapaId,
          },
          [
            'status',
            'dataInicio',
            'dataPrevista',
            'dataConclusao',
            'retornoParaEtapaId',
          ],
        ),
        origem: diffAuditoria(
          antesAtual,
          {
            status: atual.status,
            dataInicio: atual.dataInicio,
            dataPrevista: atual.dataPrevista,
            dataConclusao: atual.dataConclusao,
            retornoParaEtapaId: atual.retornoParaEtapaId,
          },
          [
            'status',
            'dataInicio',
            'dataPrevista',
            'dataConclusao',
            'retornoParaEtapaId',
          ],
        ),
      },
    };
  });

  if (eventoAuditoria) {
    await auditoria.registrar(contexto, {
      acao: 'DEVOLVER_ETAPA',
      recurso: 'processo',
      recursoId: processoId,
      justificativa: input.motivo,
      metadados: {
        ...eventoAuditoria.processo,
        etapaId,
        etapaNome: eventoAuditoria.etapaNome,
        paraEtapaId: eventoAuditoria.alvoId,
        paraEtapaNome: eventoAuditoria.alvoNome,
        alteracoes: eventoAuditoria.alteracoes,
      },
    });
  }
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
  const antes = {
    responsavelAtualId: processo.responsavelAtualId,
    setorAtualId: processo.setorAtualId,
  };
  if (input.responsavelAtualId !== undefined) {
    processo.responsavelAtualId = input.responsavelAtualId;
  }
  if (input.setorAtualId !== undefined) {
    processo.setorAtualId = input.setorAtualId;
  }
  await processo.save();

  // A atribuição do processo é independente das etapas. Não alteramos aqui
  // `processo_etapas.responsavel_id`/`setor_id`.
  const alteracoes = diffAuditoria(
    antes,
    {
      responsavelAtualId: processo.responsavelAtualId,
      setorAtualId: processo.setorAtualId,
    },
    ['responsavelAtualId', 'setorAtualId'],
  );
  await registrarMovimentacao(
    processo,
    null,
    'ALTERACAO',
    'Responsável/setor do processo atualizado.',
    contexto,
    {
      responsavelAtualId: input.responsavelAtualId ?? null,
      setorAtualId: input.setorAtualId ?? null,
      alteracoes,
    },
  );
  await auditoria.registrar(contexto, {
    acao: 'ATRIBUIR',
    recurso: 'processo',
    recursoId: id,
    metadados: {
      ...identificarProcesso(processo),
      escopo: 'processo',
      responsavelAtualId: input.responsavelAtualId ?? null,
      setorAtualId: input.setorAtualId ?? null,
      alteracoes,
    },
  });
  return detalhar(id);
}

/**
 * Atribui um responsável a uma etapa específica do processo, sem alterar as
 * demais etapas nem o responsável atual do processo. A atribuição do processo
 * e a das etapas são independentes.
 */
export async function atribuirEtapa(
  processoId: number,
  etapaId: number,
  input: { responsavelId: number | null; setorId?: number | null },
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  const processo = await carregar(processoId);
  if (
    processo.status === PROCESSO_STATUS.CONCLUIDO ||
    processo.status === PROCESSO_STATUS.ANULADO ||
    processo.status === PROCESSO_STATUS.REVOGADO
  ) {
    throw new ConflictError(
      'Processo encerrado não pode ter etapas reatribuídas.',
    );
  }
  const etapa = (processo.etapas ?? []).find((item) => item.id === etapaId);
  if (!etapa) {
    throw new NotFoundError('Etapa do processo não encontrada.');
  }
  if (
    etapa.status === PROCESSO_ETAPA_STATUS.CONCLUIDA ||
    etapa.status === PROCESSO_ETAPA_STATUS.PULADA
  ) {
    throw new ConflictError(
      'Etapas concluídas ou puladas não podem ser reatribuídas.',
    );
  }

  let responsavelNome: string | null = null;
  let setorNome: string | null = null;
  let setorId: number | null = etapa.setorId;

  if (input.responsavelId !== null) {
    const responsavel = await usuarioRepo.buscarPorId(input.responsavelId);
    if (!responsavel || !responsavel.ativo) {
      throw new ValidationError(
        'O responsável informado não existe ou está inativo.',
      );
    }
    responsavelNome = responsavel.nome;

    // Sem setor explícito, usa o setor principal do responsável. Isso mantém a
    // etapa coerente com o vínculo administrativo usuário-setor.
    if (input.setorId === undefined) {
      const vinculos = await usuarioRepo.listarVinculosSetores([
        input.responsavelId,
      ]);
      setorId =
        vinculos.find((vinculo) => vinculo.principal)?.setorId ??
        vinculos[0]?.setorId ??
        etapa.setorId;
    }
  }

  if (input.setorId !== undefined) {
    setorId = input.setorId;
  }
  if (setorId !== null) {
    const setor = await setorRepo.buscarPorId(setorId);
    if (!setor || !setor.ativo) {
      throw new ValidationError(
        'O setor informado não existe ou está inativo.',
      );
    }
    setorNome = setor.nome;
  }

  const antes = {
    responsavelId: etapa.responsavelId,
    setorId: etapa.setorId,
  };
  etapa.responsavelId = input.responsavelId;
  etapa.setorId = setorId;
  await etapa.save();
  // Não alteramos `processos.responsavel_atual_id`: a atribuição da etapa é
  // independente da atribuição do processo.
  const alteracoes = diffAuditoria(
    antes,
    { responsavelId: etapa.responsavelId, setorId: etapa.setorId },
    ['responsavelId', 'setorId'],
  );
  const descricaoSetor = setorNome ? ` no setor ${setorNome}` : '';
  await registrarMovimentacao(
    processo,
    etapa.id,
    'ALTERACAO',
    responsavelNome
      ? `Responsável da etapa "${etapa.nome}" definido como ${responsavelNome}${descricaoSetor}.`
      : `Responsável da etapa "${etapa.nome}" removido.`,
    contexto,
    {
      etapaId: etapa.id,
      etapaNome: etapa.nome,
      responsavelId: input.responsavelId,
      responsavelNome,
      setorId: etapa.setorId,
      setorNome,
      alteracoes,
    },
  );
  await auditoria.registrar(contexto, {
    acao: 'ATRIBUIR',
    recurso: 'processo',
    recursoId: processoId,
    metadados: {
      ...identificarProcesso(processo),
      escopo: 'etapa',
      etapaId: etapa.id,
      etapaNome: etapa.nome,
      responsavelId: input.responsavelId,
      responsavelNome,
      setorId: etapa.setorId,
      setorNome,
      alteracoes,
    },
  });
  return detalhar(processoId);
}

/**
 * Define ou altera o prazo interno de uma etapa do processo. O valor é mantido
 * no snapshot da etapa, permitindo ajuste específico sem alterar o fluxo de
 * origem. A data prevista é recalculada a partir do início da etapa.
 */
export async function atualizarPrazoEtapa(
  processoId: number,
  etapaId: number,
  input: { prazoGestaoDias: number | null },
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  let eventoAuditoria:
    | {
        processo: { nome: string; numero: string };
        etapaNome: string;
        alteracoes: Record<string, unknown>;
      }
    | undefined;

  await sequelize.transaction(async (transaction) => {
    const processo = await carregarComLock(processoId, transaction);
    if (
      processo.status === PROCESSO_STATUS.CONCLUIDO ||
      processo.status === PROCESSO_STATUS.ANULADO ||
      processo.status === PROCESSO_STATUS.REVOGADO
    ) {
      throw new ConflictError(
        'Processo encerrado não pode ter prazos de etapa alterados.',
      );
    }
    const etapa = localizarEtapa(processo, etapaId);
    if (
      etapa.status === PROCESSO_ETAPA_STATUS.CONCLUIDA ||
      etapa.status === PROCESSO_ETAPA_STATUS.PULADA
    ) {
      throw new ConflictError(
        'Etapas concluídas ou puladas não podem ter o prazo alterado.',
      );
    }

    const antes = {
      prazoGestaoDias: etapa.prazoGestaoDias,
      dataPrevista: etapa.dataPrevista,
    };
    etapa.prazoGestaoDias = input.prazoGestaoDias;
    etapa.dataPrevista = etapa.dataInicio
      ? calcularPrevista(etapa.dataInicio, input.prazoGestaoDias)
      : null;
    await etapa.save({ transaction });
    const alteracoes = diffAuditoria(
      antes,
      {
        prazoGestaoDias: etapa.prazoGestaoDias,
        dataPrevista: etapa.dataPrevista,
      },
      ['prazoGestaoDias', 'dataPrevista'],
    );

    await registrarMovimentacao(
      processo,
      etapa.id,
      'ALTERACAO',
      `Prazo da etapa "${etapa.nome}" atualizado para ${
        input.prazoGestaoDias === null
          ? 'sem prazo definido'
          : `${input.prazoGestaoDias} dia(s)`
      }.`,
      contexto,
      {
        etapaId: etapa.id,
        etapaNome: etapa.nome,
        alteracoes,
      },
      transaction,
    );

    eventoAuditoria = {
      processo: identificarProcesso(processo),
      etapaNome: etapa.nome,
      alteracoes,
    };
  });

  if (eventoAuditoria) {
    await auditoria.registrar(contexto, {
      acao: 'ALTERAR_PRAZO_ETAPA',
      recurso: 'processo',
      recursoId: processoId,
      metadados: {
        ...eventoAuditoria.processo,
        etapaId,
        etapaNome: eventoAuditoria.etapaNome,
        alteracoes: eventoAuditoria.alteracoes,
      },
    });
  }
  return detalhar(processoId);
}

export async function bloquearEtapa(
  processoId: number,
  etapaId: number,
  input: { motivo: string },
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  let eventoAuditoria:
    | {
        processo: { nome: string; numero: string };
        etapaNome: string;
        alteracoes: Record<string, unknown>;
      }
    | undefined;

  await sequelize.transaction(async (transaction) => {
    const processo = await carregarComLock(processoId, transaction);
    exigirProcessoEmAndamento(processo);
    const etapa = localizarEtapa(processo, etapaId);
    if (processo.processoEtapaAtualId !== etapa.id) {
      throw new ConflictError('Somente a etapa atual pode ser bloqueada.');
    }
    if (etapa.status !== PROCESSO_ETAPA_STATUS.EM_ANDAMENTO) {
      throw new ConflictError('A etapa atual não está em andamento.');
    }
    if (
      !podeTransicionarEtapa(etapa.status, PROCESSO_ETAPA_STATUS.BLOQUEADA)
    ) {
      throw new ConflictError(
        `Transição inválida: ${etapa.status} → BLOQUEADA.`,
      );
    }
    const antes = {
      status: etapa.status,
      motivoBloqueio: etapa.motivoBloqueio,
    };
    etapa.status = PROCESSO_ETAPA_STATUS.BLOQUEADA;
    etapa.motivoBloqueio = input.motivo.trim();
    await etapa.save({ transaction });
    const alteracoes = diffAuditoria(
      antes,
      { status: etapa.status, motivoBloqueio: etapa.motivoBloqueio },
      ['status', 'motivoBloqueio'],
    );

    await registrarMovimentacao(
      processo,
      etapa.id,
      'BLOQUEIO',
      `Etapa "${etapa.nome}" bloqueada. Motivo: ${input.motivo.trim()}`,
      contexto,
      {
        etapaId: etapa.id,
        etapaNome: etapa.nome,
        alteracoes,
      },
      transaction,
    );

    eventoAuditoria = {
      processo: identificarProcesso(processo),
      etapaNome: etapa.nome,
      alteracoes,
    };
  });

  if (eventoAuditoria) {
    await auditoria.registrar(contexto, {
      acao: 'BLOQUEAR_ETAPA',
      recurso: 'processo',
      recursoId: processoId,
      justificativa: input.motivo,
      metadados: {
        ...eventoAuditoria.processo,
        etapaId,
        etapaNome: eventoAuditoria.etapaNome,
        alteracoes: eventoAuditoria.alteracoes,
      },
    });
  }
  return detalhar(processoId);
}

export async function desbloquearEtapa(
  processoId: number,
  etapaId: number,
  input: { justificativa: string },
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  let eventoAuditoria:
    | {
        processo: { nome: string; numero: string };
        etapaNome: string;
        alteracoes: Record<string, unknown>;
      }
    | undefined;

  await sequelize.transaction(async (transaction) => {
    const processo = await carregarComLock(processoId, transaction);
    exigirProcessoEmAndamento(processo);
    const etapa = localizarEtapa(processo, etapaId);
    if (processo.processoEtapaAtualId !== etapa.id) {
      throw new ConflictError('Somente a etapa atual pode ser desbloqueada.');
    }
    if (etapa.status !== PROCESSO_ETAPA_STATUS.BLOQUEADA) {
      throw new ConflictError('A etapa não está bloqueada.');
    }
    if (
      !podeTransicionarEtapa(etapa.status, PROCESSO_ETAPA_STATUS.EM_ANDAMENTO)
    ) {
      throw new ConflictError(
        `Transição inválida: ${etapa.status} → EM_ANDAMENTO.`,
      );
    }
    const antes = {
      status: etapa.status,
      motivoBloqueio: etapa.motivoBloqueio,
    };
    etapa.status = PROCESSO_ETAPA_STATUS.EM_ANDAMENTO;
    etapa.motivoBloqueio = null;
    await etapa.save({ transaction });
    const alteracoes = diffAuditoria(
      antes,
      { status: etapa.status, motivoBloqueio: etapa.motivoBloqueio },
      ['status', 'motivoBloqueio'],
    );

    await registrarMovimentacao(
      processo,
      etapa.id,
      'DESBLOQUEIO',
      `Etapa "${etapa.nome}" desbloqueada. Justificativa: ${input.justificativa.trim()}`,
      contexto,
      {
        etapaId: etapa.id,
        etapaNome: etapa.nome,
        alteracoes,
      },
      transaction,
    );

    eventoAuditoria = {
      processo: identificarProcesso(processo),
      etapaNome: etapa.nome,
      alteracoes,
    };
  });

  if (eventoAuditoria) {
    await auditoria.registrar(contexto, {
      acao: 'DESBLOQUEAR_ETAPA',
      recurso: 'processo',
      recursoId: processoId,
      justificativa: input.justificativa,
      metadados: {
        ...eventoAuditoria.processo,
        etapaId,
        etapaNome: eventoAuditoria.etapaNome,
        alteracoes: eventoAuditoria.alteracoes,
      },
    });
  }
  return detalhar(processoId);
}

export async function pularEtapa(
  processoId: number,
  etapaId: number,
  input: { justificativa: string },
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  let eventoAuditoria:
    | {
        processo: { nome: string; numero: string };
        etapaNome: string;
        etapaAtual: boolean;
        proximaId: number | null;
        proximaNome: string | null;
        alteracoes: Record<string, unknown>;
      }
    | undefined;

  await sequelize.transaction(async (transaction) => {
    const processo = await carregarComLock(processoId, transaction);
    exigirProcessoEmAndamento(processo);
    const etapa = localizarEtapa(processo, etapaId);
    if (
      etapa.status === PROCESSO_ETAPA_STATUS.BLOQUEADA ||
      etapa.status === PROCESSO_ETAPA_STATUS.CONCLUIDA ||
      etapa.status === PROCESSO_ETAPA_STATUS.PULADA
    ) {
      throw new ConflictError(
        'Somente etapas pendentes ou em andamento podem ser puladas.',
      );
    }
    if (!etapaPodeSerPulada(etapa)) {
      throw new ConflictError(
        `A etapa obrigatória "${etapa.nome}" não permite pulo.`,
      );
    }
    const eraAtual = processo.processoEtapaAtualId === etapa.id;
    if (etapa.status === PROCESSO_ETAPA_STATUS.PENDENTE && eraAtual) {
      throw new ConflictError('A etapa atual não está em andamento.');
    }
    if (
      !podeTransicionarEtapa(etapa.status, PROCESSO_ETAPA_STATUS.PULADA)
    ) {
      throw new ConflictError(
        `Transição inválida: ${etapa.status} → PULADA.`,
      );
    }

    const antes = {
      status: etapa.status,
      motivoPulo: etapa.motivoPulo,
      puladaEm: etapa.puladaEm,
    };
    etapa.status = PROCESSO_ETAPA_STATUS.PULADA;
    etapa.motivoPulo = input.justificativa.trim();
    etapa.puladaEm = new Date();
    etapa.dataConclusao = null;
    etapa.motivoBloqueio = null;
    etapa.retornoParaEtapaId = null;
    await etapa.save({ transaction });

    const proxima = eraAtual
      ? proximaEtapaAposConclusao(processo.etapas ?? [], etapa)
      : undefined;

    const alteracoes = diffAuditoria(
      antes,
      {
        status: etapa.status,
        motivoPulo: etapa.motivoPulo,
        puladaEm: etapa.puladaEm,
      },
      ['status', 'motivoPulo', 'puladaEm'],
    );

    await registrarMovimentacao(
      processo,
      etapa.id,
      'PULO_ETAPA',
      `Etapa "${etapa.nome}" pulada. Justificativa: ${input.justificativa.trim()}`,
      contexto,
      {
        etapaId: etapa.id,
        etapaNome: etapa.nome,
        etapaAtual: eraAtual,
        proximaEtapaId: proxima?.id ?? null,
        proximaEtapaNome: proxima?.nome ?? null,
        obrigatoria: etapa.obrigatoria,
        permitePulo: etapa.permitePulo,
        alteracoes,
      },
      transaction,
    );
    if (eraAtual) {
      await ativarProximaEtapa(processo, etapa, transaction);
    }
    if (proxima) {
      await registrarMovimentacao(
        processo,
        proxima.id,
        'ENCAMINHAMENTO',
        `Encaminhado para a etapa "${proxima.nome}" após pulo de etapa.`,
        contexto,
        null,
        transaction,
      );
    }

    eventoAuditoria = {
      processo: identificarProcesso(processo),
      etapaNome: etapa.nome,
      etapaAtual: eraAtual,
      proximaId: proxima?.id ?? null,
      proximaNome: proxima?.nome ?? null,
      alteracoes,
    };
  });

  if (eventoAuditoria) {
    await auditoria.registrar(contexto, {
      acao: 'PULAR_ETAPA',
      recurso: 'processo',
      recursoId: processoId,
      justificativa: input.justificativa,
      metadados: {
        ...eventoAuditoria.processo,
        etapaId,
        etapaNome: eventoAuditoria.etapaNome,
        etapaAtual: eventoAuditoria.etapaAtual,
        proximaEtapaId: eventoAuditoria.proximaId,
        proximaEtapaNome: eventoAuditoria.proximaNome,
        alteracoes: eventoAuditoria.alteracoes,
      },
    });
  }
  return detalhar(processoId);
}

export async function suspender(
  id: number,
  justificativa: string,
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  const processo = await carregar(id);
  transicionar(processo, PROCESSO_STATUS.SUSPENSO);
  const antes = { status: processo.status };
  await processoRepo.atualizar(processo, { status: PROCESSO_STATUS.SUSPENSO });
  const alteracoes = diffAuditoria(
    antes,
    { status: processo.status },
    ['status'],
  );
  await registrarMovimentacao(
    processo,
    processo.processoEtapaAtualId,
    'SUSPENSAO',
    justificativa.trim(),
    contexto,
    { alteracoes },
  );
  await auditoria.registrar(contexto, {
    acao: 'SUSPENDER',
    recurso: 'processo',
    recursoId: id,
    justificativa,
    metadados: { ...identificarProcesso(processo), alteracoes },
  });
  return detalhar(id);
}

export async function retomar(
  id: number,
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  const processo = await carregar(id);
  transicionar(processo, PROCESSO_STATUS.EM_ANDAMENTO);
  const antes = { status: processo.status };
  await processoRepo.atualizar(processo, {
    status: PROCESSO_STATUS.EM_ANDAMENTO,
  });
  const alteracoes = diffAuditoria(
    antes,
    { status: processo.status },
    ['status'],
  );
  await registrarMovimentacao(
    processo,
    processo.processoEtapaAtualId,
    'RETOMADA',
    'Processo retomado.',
    contexto,
    { alteracoes },
  );
  await auditoria.registrar(contexto, {
    acao: 'RETOMAR',
    recurso: 'processo',
    recursoId: id,
    metadados: { ...identificarProcesso(processo), alteracoes },
  });
  return detalhar(id);
}

export async function encerrar(
  id: number,
  status: 'ANULADO' | 'REVOGADO' | 'CONCLUIDO',
  justificativa: string,
  contexto: ContextoRequisicao,
): Promise<ProcessoDetalheDTO> {
  let eventoAuditoria:
    | {
        processo: { nome: string; numero: string };
        etapasPuladas: Array<{
          id: number;
          nome: string;
          motivoPulo: string | null;
        }>;
        alteracoes: Record<string, unknown>;
      }
    | undefined;

  await sequelize.transaction(async (transaction) => {
    const processo = await carregarComLock(id, transaction);
    transicionar(processo, status);
    const agora = new Date();
    const etapaAtualId = processo.processoEtapaAtualId;
    const antesProcesso = {
      status: processo.status,
      finalizadoEm: processo.finalizadoEm,
    };

    const etapasPuladas: ProcessoEtapa[] = [];
    if (status === PROCESSO_STATUS.CONCLUIDO) {
      const { obrigatorias, opcionais } = classificarPendenciasConclusao(
        processo.etapas ?? [],
      );
      if (obrigatorias.length > 0) {
        throw new ConflictError(
          `Não é possível concluir: há etapa(s) obrigatória(s) não concluída(s): ${obrigatorias
            .map((etapa) => `${etapa.sequencia}. ${etapa.nome}`)
            .join('; ')}.`,
          {
            etapas: obrigatorias.map((etapa) => ({
              id: etapa.id,
              nome: etapa.nome,
              sequencia: etapa.sequencia,
            })),
          },
        );
      }
      for (const etapa of opcionais) {
        etapa.status = PROCESSO_ETAPA_STATUS.PULADA;
        etapa.motivoPulo =
          'Etapa opcional pendente pulada automaticamente na conclusão do processo.';
        etapa.puladaEm = agora;
        etapa.motivoBloqueio = null;
        etapa.dataConclusao = null;
        etapa.retornoParaEtapaId = null;
        await etapa.save({ transaction });
        await registrarMovimentacao(
          processo,
          etapa.id,
          'PULO_ETAPA',
          `Etapa opcional "${etapa.nome}" pulada automaticamente na conclusão do processo.`,
          contexto,
          {
            etapaId: etapa.id,
            etapaNome: etapa.nome,
            origem: 'CONCLUSAO_PROCESSO',
            motivoPulo: etapa.motivoPulo,
          },
          transaction,
        );
        etapasPuladas.push(etapa);
      }
    }

    await processoRepo.atualizar(
      processo,
      {
        status,
        finalizadoEm: agora,
        processoEtapaAtualId: null,
        responsavelAtualId: null,
      },
      transaction,
    );
    const alteracoesProcesso = diffAuditoria(
      antesProcesso,
      { status: processo.status, finalizadoEm: processo.finalizadoEm },
      ['status', 'finalizadoEm'],
    );
    await registrarMovimentacao(
      processo,
      etapaAtualId,
      status === 'CONCLUIDO' ? 'CONCLUSAO_PROCESSO' : 'ALTERACAO',
      justificativa.trim(),
      contexto,
      {
        etapasPuladasAutomaticamente: etapasPuladas.map((etapa) => ({
          id: etapa.id,
          nome: etapa.nome,
        })),
        alteracoes: alteracoesProcesso,
      },
      transaction,
    );

    eventoAuditoria = {
      processo: identificarProcesso(processo),
      etapasPuladas: etapasPuladas.map((etapa) => ({
        id: etapa.id,
        nome: etapa.nome,
        motivoPulo: etapa.motivoPulo,
      })),
      alteracoes: alteracoesProcesso,
    };
  });

  if (eventoAuditoria) {
    await auditoria.registrar(contexto, {
      acao: status,
      recurso: 'processo',
      recursoId: id,
      justificativa,
      metadados: {
        ...eventoAuditoria.processo,
        etapasPuladasAutomaticamente: eventoAuditoria.etapasPuladas,
        alteracoes: eventoAuditoria.alteracoes,
      },
    });
  }
  return detalhar(id);
}

export async function movimentacoes(
  id: number,
): Promise<MovimentacaoDTO[]> {
  await carregar(id);
  const movs = await movRepo.listarPorProcesso(id);
  return movs.map(movimentacaoToDTO);
}
