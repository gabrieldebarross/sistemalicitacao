import { ConflictError, NotFoundError } from '../errors/app-error.js';
import type { VisaoSalva } from '../models/visao-salva.js';
import * as visaoRepo from '../repositories/visao-salva.repository.js';
import type { ContextoRequisicao } from '../types/context.js';
import * as auditoria from './auditoria.service.js';

export interface VisaoSalvaDTO {
  id: number;
  nome: string;
  filtros: Record<string, unknown>;
  criadoEm: Date;
  atualizadoEm: Date;
}

function toDTO(visao: VisaoSalva): VisaoSalvaDTO {
  return {
    id: visao.id,
    nome: visao.nome,
    filtros: visao.filtros,
    criadoEm: visao.createdAt,
    atualizadoEm: visao.updatedAt,
  };
}

export async function listar(usuarioId: number): Promise<VisaoSalvaDTO[]> {
  return (await visaoRepo.listarPorUsuario(usuarioId)).map(toDTO);
}

export async function criar(
  usuarioId: number,
  input: { nome: string; filtros: Record<string, unknown> },
  contexto: ContextoRequisicao,
): Promise<VisaoSalvaDTO> {
  const nome = input.nome.trim();
  if (await visaoRepo.buscarPorNome(usuarioId, nome)) {
    throw new ConflictError('Já existe uma visão salva com este nome.');
  }
  const visao = await visaoRepo.criar(usuarioId, nome, input.filtros);
  await auditoria.registrar(contexto, {
    acao: 'CRIAR',
    recurso: 'visao_salva',
    recursoId: visao.id,
    metadados: { nome },
  });
  return toDTO(visao);
}

export async function atualizar(
  usuarioId: number,
  id: number,
  input: { nome?: string; filtros?: Record<string, unknown> },
  contexto: ContextoRequisicao,
): Promise<VisaoSalvaDTO> {
  const visao = await visaoRepo.buscarDoUsuario(id, usuarioId);
  if (!visao) {
    throw new NotFoundError('Visão salva não encontrada.');
  }
  if (input.nome !== undefined) {
    const nome = input.nome.trim();
    const existente = await visaoRepo.buscarPorNome(usuarioId, nome);
    if (existente && existente.id !== visao.id) {
      throw new ConflictError('Já existe uma visão salva com este nome.');
    }
    visao.nome = nome;
  }
  if (input.filtros !== undefined) {
    visao.filtros = input.filtros;
  }
  await visao.save();
  await auditoria.registrar(contexto, {
    acao: 'ALTERAR',
    recurso: 'visao_salva',
    recursoId: visao.id,
    metadados: { nome: visao.nome, campos: Object.keys(input) },
  });
  return toDTO(visao);
}

export async function remover(
  usuarioId: number,
  id: number,
  contexto: ContextoRequisicao,
): Promise<void> {
  const visao = await visaoRepo.buscarDoUsuario(id, usuarioId);
  if (!visao) {
    throw new NotFoundError('Visão salva não encontrada.');
  }
  await visaoRepo.remover(visao);
  await auditoria.registrar(contexto, {
    acao: 'REMOVER',
    recurso: 'visao_salva',
    recursoId: id,
    metadados: { nome: visao.nome },
  });
}
