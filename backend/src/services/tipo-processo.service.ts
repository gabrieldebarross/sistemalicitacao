import { normalizarNome } from '../domain/normalization.js';
import { ConflictError, NotFoundError } from '../errors/app-error.js';
import type { TipoProcesso } from '../models/tipo-processo.js';
import * as tipoRepo from '../repositories/tipo-processo.repository.js';
import type { ContextoRequisicao } from '../types/context.js';
import { montarPaginado, type ResultadoPaginado } from '../utils/http.js';
import { resolverPaginacao } from '../utils/pagination.js';
import * as auditoria from './auditoria.service.js';

export interface TipoProcessoDTO {
  id: number;
  nome: string;
  descricao: string | null;
  baseLegal: string | null;
  ativo: boolean;
}

function toDTO(tipo: TipoProcesso): TipoProcessoDTO {
  return {
    id: tipo.id,
    nome: tipo.nome,
    descricao: tipo.descricao,
    baseLegal: tipo.baseLegal,
    ativo: tipo.ativo,
  };
}

export async function listar(input: {
  busca?: string;
  ativo?: boolean;
  pagina: number;
  tamanhoPagina: number;
}): Promise<ResultadoPaginado<TipoProcessoDTO>> {
  const { offset, limit, pagina, tamanhoPagina } = resolverPaginacao(input);
  const filtro: tipoRepo.FiltroTipoProcesso = {};
  if (input.busca) {
    filtro.busca = input.busca;
  }
  if (input.ativo !== undefined) {
    filtro.ativo = input.ativo;
  }
  const { itens, total } = await tipoRepo.listar(filtro, offset, limit);
  return montarPaginado(itens.map(toDTO), total, pagina, tamanhoPagina);
}

export async function buscarPorId(id: number): Promise<TipoProcessoDTO> {
  const tipo = await tipoRepo.buscarPorId(id);
  if (!tipo) {
    throw new NotFoundError('Tipo de processo não encontrado.');
  }
  return toDTO(tipo);
}

export async function criar(
  input: {
    nome: string;
    descricao?: string;
    baseLegal?: string;
  },
  contexto: ContextoRequisicao,
): Promise<TipoProcessoDTO> {
  const nome = normalizarNome(input.nome);
  const existente = await tipoRepo.buscarPorNome(nome);
  if (existente) {
    throw new ConflictError('Já existe um tipo de processo com este nome.');
  }
  const tipo = await tipoRepo.criar({
    nome,
    descricao: input.descricao?.trim() || null,
    baseLegal: input.baseLegal?.trim() || null,
  });
  await auditoria.registrar(contexto, {
    acao: 'CRIAR',
    recurso: 'tipo_processo',
    recursoId: tipo.id,
    metadados: { nome: tipo.nome },
  });
  return toDTO(tipo);
}

export async function atualizar(
  id: number,
  input: {
    nome?: string;
    descricao?: string | null;
    baseLegal?: string | null;
    ativo?: boolean;
  },
  contexto: ContextoRequisicao,
): Promise<TipoProcessoDTO> {
  const tipo = await tipoRepo.buscarPorId(id);
  if (!tipo) {
    throw new NotFoundError('Tipo de processo não encontrado.');
  }
  if (input.nome !== undefined) {
    const nome = normalizarNome(input.nome);
    const existente = await tipoRepo.buscarPorNome(nome);
    if (existente && existente.id !== id) {
      throw new ConflictError('Já existe um tipo de processo com este nome.');
    }
    tipo.nome = nome;
  }
  if (input.descricao !== undefined) {
    tipo.descricao = input.descricao;
  }
  if (input.baseLegal !== undefined) {
    tipo.baseLegal = input.baseLegal;
  }
  if (input.ativo !== undefined) {
    tipo.ativo = input.ativo;
  }
  await tipo.save();
  await auditoria.registrar(contexto, {
    acao: 'ALTERAR',
    recurso: 'tipo_processo',
    recursoId: tipo.id,
  });
  return toDTO(tipo);
}
