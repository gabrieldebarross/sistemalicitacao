import { normalizarNome } from '../domain/normalization.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../errors/app-error.js';
import type { Etapa } from '../models/etapa.js';
import type { Fase } from '../models/fase.js';
import type { Fluxo } from '../models/fluxo.js';
import * as fluxoRepo from '../repositories/fluxo.repository.js';
import * as processoRepo from '../repositories/processo.repository.js';
import * as tipoRepo from '../repositories/tipo-processo.repository.js';
import * as usuarioRepo from '../repositories/usuario.repository.js';
import type { ContextoRequisicao } from '../types/context.js';
import { montarPaginado, type ResultadoPaginado } from '../utils/http.js';
import { resolverPaginacao } from '../utils/pagination.js';
import * as auditoria from './auditoria.service.js';

export interface EtapaDTO {
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

export interface FaseDTO {
  id: number;
  nome: string;
  ordem: number;
  descricao: string | null;
  etapas: EtapaDTO[];
}

export interface FluxoDTO {
  id: number;
  tipoProcessoId: number;
  tipoProcessoNome: string | null;
  nome: string;
  descricao: string | null;
  versao: number;
  situacao: string;
  publicadoEm: Date | null;
  fases: FaseDTO[];
}

export interface FluxoResumoDTO {
  id: number;
  tipoProcessoId: number;
  tipoProcessoNome: string | null;
  nome: string;
  versao: number;
  situacao: string;
  publicadoEm: Date | null;
}

function etapaToDTO(etapa: Etapa): EtapaDTO {
  return {
    id: etapa.id,
    nome: etapa.nome,
    ordem: etapa.ordem,
    obrigatoria: etapa.obrigatoria,
    prazoGestaoDias: etapa.prazoGestaoDias,
    responsavelSetorId: etapa.responsavelSetorId,
    responsavelCargoId: etapa.responsavelCargoId,
    responsavelUsuarioId: etapa.responsavelUsuarioId,
    descricao: etapa.descricao,
    requisitos: etapa.requisitos,
    referenciaLegal: etapa.referenciaLegal,
    condicional: etapa.condicional,
    condicaoAplicabilidade: etapa.condicaoAplicabilidade,
  };
}

function faseToDTO(fase: Fase): FaseDTO {
  return {
    id: fase.id,
    nome: fase.nome,
    ordem: fase.ordem,
    descricao: fase.descricao,
    etapas: (fase.etapas ?? [])
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map(etapaToDTO),
  };
}

function toDTO(fluxo: Fluxo): FluxoDTO {
  return {
    id: fluxo.id,
    tipoProcessoId: fluxo.tipoProcessoId,
    tipoProcessoNome: fluxo.tipoProcesso?.nome ?? null,
    nome: fluxo.nome,
    descricao: fluxo.descricao,
    versao: fluxo.versao,
    situacao: fluxo.situacao,
    publicadoEm: fluxo.publicadoEm,
    fases: (fluxo.fases ?? [])
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map(faseToDTO),
  };
}

function toResumo(fluxo: Fluxo): FluxoResumoDTO {
  return {
    id: fluxo.id,
    tipoProcessoId: fluxo.tipoProcessoId,
    tipoProcessoNome: fluxo.tipoProcesso?.nome ?? null,
    nome: fluxo.nome,
    versao: fluxo.versao,
    situacao: fluxo.situacao,
    publicadoEm: fluxo.publicadoEm,
  };
}

function garantirEditavel(fluxo: Fluxo): void {
  if (fluxo.situacao !== 'RASCUNHO') {
    throw new ConflictError(
      'Somente fluxos em rascunho podem ser alterados. Crie uma nova versão.',
    );
  }
}

async function validarResponsavelUsuario(
  usuarioId: number | null | undefined,
): Promise<void> {
  if (usuarioId === null || usuarioId === undefined) {
    return;
  }
  const usuario = await usuarioRepo.buscarPorId(usuarioId);
  if (!usuario || !usuario.ativo) {
    throw new ValidationError(
      'Usuário responsável não encontrado ou inativo.',
    );
  }
}

export async function listar(input: {
  tipoProcessoId?: number;
  situacao?: string;
  pagina: number;
  tamanhoPagina: number;
}): Promise<ResultadoPaginado<FluxoResumoDTO>> {
  const { offset, limit, pagina, tamanhoPagina } = resolverPaginacao(input);
  const filtro: fluxoRepo.FiltroFluxo = {};
  if (input.tipoProcessoId !== undefined) {
    filtro.tipoProcessoId = input.tipoProcessoId;
  }
  if (input.situacao !== undefined) {
    filtro.situacao = input.situacao;
  }
  const { itens, total } = await fluxoRepo.listar(filtro, offset, limit);
  return montarPaginado(itens.map(toResumo), total, pagina, tamanhoPagina);
}

export async function detalhar(id: number): Promise<FluxoDTO> {
  const fluxo = await fluxoRepo.buscarPorId(id);
  if (!fluxo) {
    throw new NotFoundError('Fluxo não encontrado.');
  }
  return toDTO(fluxo);
}

export async function criar(
  input: { tipoProcessoId: number; nome: string; descricao?: string },
  contexto: ContextoRequisicao,
): Promise<FluxoDTO> {
  const tipo = await tipoRepo.buscarPorId(input.tipoProcessoId);
  if (!tipo || !tipo.ativo) {
    throw new NotFoundError('Tipo de processo não encontrado ou inativo.');
  }
  const nome = normalizarNome(input.nome);
  const versao = (await fluxoRepo.ultimaVersao(tipo.id, nome)) + 1;
  const fluxo = await fluxoRepo.criar({
    tipoProcessoId: tipo.id,
    nome,
    descricao: input.descricao?.trim() || null,
    versao,
  });
  await auditoria.registrar(contexto, {
    acao: 'CRIAR',
    recurso: 'fluxo',
    recursoId: fluxo.id,
    metadados: { tipoProcessoId: tipo.id, versao },
  });
  return detalhar(fluxo.id);
}

export async function atualizar(
  id: number,
  input: { nome?: string; descricao?: string | null },
  contexto: ContextoRequisicao,
): Promise<FluxoDTO> {
  const fluxo = await fluxoRepo.buscarPorId(id);
  if (!fluxo) {
    throw new NotFoundError('Fluxo não encontrado.');
  }
  garantirEditavel(fluxo);
  if (input.nome !== undefined) {
    fluxo.nome = normalizarNome(input.nome);
  }
  if (input.descricao !== undefined) {
    fluxo.descricao = input.descricao;
  }
  await fluxo.save();
  await auditoria.registrar(contexto, {
    acao: 'ALTERAR',
    recurso: 'fluxo',
    recursoId: fluxo.id,
  });
  return detalhar(fluxo.id);
}

export async function publicar(
  id: number,
  contexto: ContextoRequisicao,
): Promise<FluxoDTO> {
  const fluxo = await fluxoRepo.buscarPorId(id);
  if (!fluxo) {
    throw new NotFoundError('Fluxo não encontrado.');
  }
  garantirEditavel(fluxo);
  const fases = fluxo.fases ?? [];
  const totalEtapas = fases.reduce(
    (total, fase) => total + (fase.etapas?.length ?? 0),
    0,
  );
  if (fases.length === 0 || totalEtapas === 0) {
    throw new ConflictError(
      'O fluxo precisa ter ao menos uma fase e uma etapa para ser publicado.',
    );
  }
  // Publicar uma nova versão NÃO arquiva automaticamente as versões anteriores.
  // O arquivamento é uma decisão explícita (permissão fluxos.archive).
  await fluxo.update({
    situacao: 'PUBLICADO',
    publicadoEm: new Date(),
    publicadoPorId: contexto.usuarioId,
  });
  await auditoria.registrar(contexto, {
    acao: 'PUBLICAR',
    recurso: 'fluxo',
    recursoId: fluxo.id,
  });
  return detalhar(fluxo.id);
}

export async function arquivar(
  id: number,
  contexto: ContextoRequisicao,
): Promise<FluxoDTO> {
  const fluxo = await fluxoRepo.buscarPorId(id);
  if (!fluxo) {
    throw new NotFoundError('Fluxo não encontrado.');
  }
  if (fluxo.situacao === 'ARQUIVADO') {
    return toDTO(fluxo);
  }
  const emUso = await processoRepo.contarAtivosPorFluxo(fluxo.id);
  if (emUso > 0) {
    throw new ConflictError(
      `Este fluxo está em uso por ${emUso} processo(s) em andamento ou em rascunho e não pode ser arquivado.`,
    );
  }
  await fluxoRepo.arquivar(fluxo);
  await auditoria.registrar(contexto, {
    acao: 'ARQUIVAR',
    recurso: 'fluxo',
    recursoId: fluxo.id,
  });
  return detalhar(fluxo.id);
}

export async function clonar(
  id: number,
  input: { nome?: string },
  contexto: ContextoRequisicao,
): Promise<FluxoDTO> {
  const origem = await fluxoRepo.buscarPorId(id);
  if (!origem) {
    throw new NotFoundError('Fluxo não encontrado.');
  }
  const nome = input.nome ? normalizarNome(input.nome) : origem.nome;
  const versao = (await fluxoRepo.ultimaVersao(origem.tipoProcessoId, nome)) + 1;
  const novo = await fluxoRepo.clonar(origem, nome, versao);
  await auditoria.registrar(contexto, {
    acao: 'CLONAR',
    recurso: 'fluxo',
    recursoId: novo.id,
    metadados: { origemId: origem.id, versao },
  });
  return detalhar(novo.id);
}

export async function criarFase(
  fluxoId: number,
  input: { nome: string; ordem?: number; descricao?: string },
  contexto: ContextoRequisicao,
): Promise<FluxoDTO> {
  const fluxo = await fluxoRepo.buscarPorId(fluxoId);
  if (!fluxo) {
    throw new NotFoundError('Fluxo não encontrado.');
  }
  garantirEditavel(fluxo);
  const ordem = input.ordem ?? (await fluxoRepo.proximaOrdemFase(fluxoId));
  await fluxoRepo.criarFase({
    fluxoId,
    nome: normalizarNome(input.nome),
    ordem,
    descricao: input.descricao?.trim() || null,
  });
  await auditoria.registrar(contexto, {
    acao: 'CRIAR_FASE',
    recurso: 'fluxo',
    recursoId: fluxoId,
  });
  return detalhar(fluxoId);
}

export async function atualizarFase(
  faseId: number,
  input: { nome?: string; ordem?: number; descricao?: string | null },
  contexto: ContextoRequisicao,
): Promise<FluxoDTO> {
  const fase = await fluxoRepo.buscarFasePorId(faseId);
  if (!fase || !fase.fluxo) {
    throw new NotFoundError('Fase não encontrada.');
  }
  garantirEditavel(fase.fluxo);
  if (input.nome !== undefined) {
    fase.nome = normalizarNome(input.nome);
  }
  if (input.ordem !== undefined) {
    fase.ordem = input.ordem;
  }
  if (input.descricao !== undefined) {
    fase.descricao = input.descricao;
  }
  await fase.save();
  await auditoria.registrar(contexto, {
    acao: 'ALTERAR_FASE',
    recurso: 'fase',
    recursoId: faseId,
  });
  return detalhar(fase.fluxoId);
}

export async function removerFase(
  faseId: number,
  contexto: ContextoRequisicao,
): Promise<FluxoDTO> {
  const fase = await fluxoRepo.buscarFasePorId(faseId);
  if (!fase || !fase.fluxo) {
    throw new NotFoundError('Fase não encontrada.');
  }
  garantirEditavel(fase.fluxo);
  const fluxoId = fase.fluxoId;
  await fluxoRepo.removerFase(fase);
  await auditoria.registrar(contexto, {
    acao: 'REMOVER_FASE',
    recurso: 'fase',
    recursoId: faseId,
  });
  return detalhar(fluxoId);
}

export interface DadosEtapa {
  nome: string;
  ordem?: number;
  obrigatoria?: boolean;
  prazoGestaoDias?: number | null;
  responsavelSetorId?: number | null;
  responsavelCargoId?: number | null;
  responsavelUsuarioId?: number | null;
  descricao?: string;
  requisitos?: string;
  referenciaLegal?: string;
  condicional?: boolean;
  condicaoAplicabilidade?: string;
}

export async function criarEtapa(
  faseId: number,
  input: DadosEtapa,
  contexto: ContextoRequisicao,
): Promise<FluxoDTO> {
  const fase = await fluxoRepo.buscarFasePorId(faseId);
  if (!fase || !fase.fluxo) {
    throw new NotFoundError('Fase não encontrada.');
  }
  garantirEditavel(fase.fluxo);
  await validarResponsavelUsuario(input.responsavelUsuarioId);
  const ordem = input.ordem ?? (await fluxoRepo.proximaOrdemEtapa(faseId));
  await fluxoRepo.criarEtapa({
    faseId,
    nome: normalizarNome(input.nome),
    ordem,
    obrigatoria: input.obrigatoria ?? true,
    prazoGestaoDias: input.prazoGestaoDias ?? null,
    responsavelSetorId: input.responsavelSetorId ?? null,
    responsavelCargoId: input.responsavelCargoId ?? null,
    responsavelUsuarioId: input.responsavelUsuarioId ?? null,
    descricao: input.descricao?.trim() || null,
    requisitos: input.requisitos?.trim() || null,
    referenciaLegal: input.referenciaLegal?.trim() || null,
    condicional: input.condicional ?? false,
    condicaoAplicabilidade: input.condicaoAplicabilidade?.trim() || null,
  });
  await auditoria.registrar(contexto, {
    acao: 'CRIAR_ETAPA',
    recurso: 'fase',
    recursoId: faseId,
  });
  return detalhar(fase.fluxoId);
}

export async function atualizarEtapa(
  etapaId: number,
  input: Partial<DadosEtapa>,
  contexto: ContextoRequisicao,
): Promise<FluxoDTO> {
  const etapa = await fluxoRepo.buscarEtapaPorId(etapaId);
  if (!etapa || !etapa.fase?.fluxo) {
    throw new NotFoundError('Etapa não encontrada.');
  }
  garantirEditavel(etapa.fase.fluxo);
  if (input.nome !== undefined) {
    etapa.nome = normalizarNome(input.nome);
  }
  if (input.ordem !== undefined) {
    etapa.ordem = input.ordem;
  }
  if (input.obrigatoria !== undefined) {
    etapa.obrigatoria = input.obrigatoria;
  }
  if (input.prazoGestaoDias !== undefined) {
    etapa.prazoGestaoDias = input.prazoGestaoDias;
  }
  if (input.responsavelSetorId !== undefined) {
    etapa.responsavelSetorId = input.responsavelSetorId;
  }
  if (input.responsavelCargoId !== undefined) {
    etapa.responsavelCargoId = input.responsavelCargoId;
  }
  if (input.responsavelUsuarioId !== undefined) {
    await validarResponsavelUsuario(input.responsavelUsuarioId);
    etapa.responsavelUsuarioId = input.responsavelUsuarioId;
  }
  if (input.descricao !== undefined) {
    etapa.descricao = input.descricao;
  }
  if (input.requisitos !== undefined) {
    etapa.requisitos = input.requisitos;
  }
  if (input.referenciaLegal !== undefined) {
    etapa.referenciaLegal = input.referenciaLegal;
  }
  if (input.condicional !== undefined) {
    etapa.condicional = input.condicional;
  }
  if (input.condicaoAplicabilidade !== undefined) {
    etapa.condicaoAplicabilidade = input.condicaoAplicabilidade;
  }
  await etapa.save();
  await auditoria.registrar(contexto, {
    acao: 'ALTERAR_ETAPA',
    recurso: 'etapa',
    recursoId: etapaId,
  });
  return detalhar(etapa.fase.fluxoId);
}

export async function removerEtapa(
  etapaId: number,
  contexto: ContextoRequisicao,
): Promise<FluxoDTO> {
  const etapa = await fluxoRepo.buscarEtapaPorId(etapaId);
  if (!etapa || !etapa.fase?.fluxo) {
    throw new NotFoundError('Etapa não encontrada.');
  }
  garantirEditavel(etapa.fase.fluxo);
  const fluxoId = etapa.fase.fluxoId;
  await fluxoRepo.removerEtapa(etapa);
  await auditoria.registrar(contexto, {
    acao: 'REMOVER_ETAPA',
    recurso: 'etapa',
    recursoId: etapaId,
  });
  return detalhar(fluxoId);
}
