import { normalizarNome } from '../domain/normalization.js';
import { ConflictError, NotFoundError } from '../errors/app-error.js';
import type { Setor } from '../models/setor.js';
import * as setorRepo from '../repositories/setor.repository.js';
import type { ContextoRequisicao } from '../types/context.js';
import { montarPaginado, type ResultadoPaginado } from '../utils/http.js';
import { resolverPaginacao } from '../utils/pagination.js';
import * as auditoria from './auditoria.service.js';

export interface SetorDTO {
  id: number;
  nome: string;
  sigla: string | null;
  ativo: boolean;
}

function toDTO(setor: Setor): SetorDTO {
  return {
    id: setor.id,
    nome: setor.nome,
    sigla: setor.sigla,
    ativo: setor.ativo,
  };
}

export async function listar(input: {
  busca?: string;
  ativo?: boolean;
  pagina: number;
  tamanhoPagina: number;
}): Promise<ResultadoPaginado<SetorDTO>> {
  const { offset, limit, pagina, tamanhoPagina } = resolverPaginacao(input);
  const filtro: setorRepo.FiltroSetor = {};
  if (input.busca) {
    filtro.busca = input.busca;
  }
  if (input.ativo !== undefined) {
    filtro.ativo = input.ativo;
  }
  const { itens, total } = await setorRepo.listar(filtro, offset, limit);
  return montarPaginado(itens.map(toDTO), total, pagina, tamanhoPagina);
}

export async function buscarPorId(id: number): Promise<SetorDTO> {
  const setor = await setorRepo.buscarPorId(id);
  if (!setor) {
    throw new NotFoundError('Setor não encontrado.');
  }
  return toDTO(setor);
}

export async function criar(
  input: { nome: string; sigla?: string },
  contexto: ContextoRequisicao,
): Promise<SetorDTO> {
  const nome = normalizarNome(input.nome);
  const existente = await setorRepo.buscarPorNome(nome);
  if (existente) {
    throw new ConflictError('Já existe um setor com este nome.');
  }
  const setor = await setorRepo.criar({
    nome,
    sigla: input.sigla?.trim() || null,
  });
  await auditoria.registrar(contexto, {
    acao: 'CRIAR',
    recurso: 'setor',
    recursoId: setor.id,
    metadados: { nome: setor.nome },
  });
  return toDTO(setor);
}

export async function atualizar(
  id: number,
  input: { nome?: string; sigla?: string | null; ativo?: boolean },
  contexto: ContextoRequisicao,
): Promise<SetorDTO> {
  const setor = await setorRepo.buscarPorId(id);
  if (!setor) {
    throw new NotFoundError('Setor não encontrado.');
  }
  if (input.nome !== undefined) {
    const nome = normalizarNome(input.nome);
    const existente = await setorRepo.buscarPorNome(nome);
    if (existente && existente.id !== id) {
      throw new ConflictError('Já existe um setor com este nome.');
    }
    setor.nome = nome;
  }
  if (input.sigla !== undefined) {
    setor.sigla = input.sigla;
  }
  if (input.ativo !== undefined) {
    setor.ativo = input.ativo;
  }
  await setor.save();
  await auditoria.registrar(contexto, {
    acao: 'ALTERAR',
    recurso: 'setor',
    recursoId: setor.id,
  });
  return toDTO(setor);
}
