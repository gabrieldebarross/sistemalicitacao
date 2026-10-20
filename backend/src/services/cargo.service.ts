import { normalizarNome } from '../domain/normalization.js';
import { ConflictError, NotFoundError } from '../errors/app-error.js';
import type { Cargo } from '../models/cargo.js';
import * as cargoRepo from '../repositories/cargo.repository.js';
import type { ContextoRequisicao } from '../types/context.js';
import { montarPaginado, type ResultadoPaginado } from '../utils/http.js';
import { resolverPaginacao } from '../utils/pagination.js';
import * as auditoria from './auditoria.service.js';

export interface CargoDTO {
  id: number;
  nome: string;
  nomeOriginal: string | null;
}

function toDTO(cargo: Cargo): CargoDTO {
  return {
    id: cargo.id,
    nome: cargo.nome,
    nomeOriginal: cargo.nomeOriginal,
  };
}

export async function listar(input: {
  busca?: string;
  pagina: number;
  tamanhoPagina: number;
}): Promise<ResultadoPaginado<CargoDTO>> {
  const { offset, limit, pagina, tamanhoPagina } = resolverPaginacao(input);
  const filtro: cargoRepo.FiltroCargo = input.busca
    ? { busca: input.busca }
    : {};
  const { itens, total } = await cargoRepo.listar(filtro, offset, limit);
  return montarPaginado(itens.map(toDTO), total, pagina, tamanhoPagina);
}

export async function buscarPorId(id: number): Promise<CargoDTO> {
  const cargo = await cargoRepo.buscarPorId(id);
  if (!cargo) {
    throw new NotFoundError('Cargo não encontrado.');
  }
  return toDTO(cargo);
}

export async function criar(
  input: { nome: string; nomeOriginal?: string },
  contexto: ContextoRequisicao,
): Promise<CargoDTO> {
  const nome = normalizarNome(input.nome);
  if (nome.length === 0) {
    throw new ConflictError('Nome do cargo é obrigatório.');
  }
  const existente = await cargoRepo.buscarPorNome(nome);
  if (existente) {
    throw new ConflictError('Já existe um cargo com este nome.');
  }
  const cargo = await cargoRepo.criar({
    nome,
    nomeOriginal: input.nomeOriginal ?? null,
  });
  await auditoria.registrar(contexto, {
    acao: 'CRIAR',
    recurso: 'cargo',
    recursoId: cargo.id,
    metadados: { nome: cargo.nome },
  });
  return toDTO(cargo);
}

export async function atualizar(
  id: number,
  input: { nome?: string; nomeOriginal?: string },
  contexto: ContextoRequisicao,
): Promise<CargoDTO> {
  const cargo = await cargoRepo.buscarPorId(id);
  if (!cargo) {
    throw new NotFoundError('Cargo não encontrado.');
  }
  if (input.nome !== undefined) {
    const nome = normalizarNome(input.nome);
    const existente = await cargoRepo.buscarPorNome(nome);
    if (existente && existente.id !== id) {
      throw new ConflictError('Já existe um cargo com este nome.');
    }
    cargo.nome = nome;
  }
  if (input.nomeOriginal !== undefined) {
    cargo.nomeOriginal = input.nomeOriginal;
  }
  await cargo.save();
  await auditoria.registrar(contexto, {
    acao: 'ALTERAR',
    recurso: 'cargo',
    recursoId: cargo.id,
  });
  return toDTO(cargo);
}
