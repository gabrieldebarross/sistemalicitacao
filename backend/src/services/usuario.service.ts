import { sequelize } from '../config/database.js';
import { normalizarEmail, normalizarNome } from '../domain/normalization.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../errors/app-error.js';
import type { Usuario } from '../models/usuario.js';
import * as roleRepo from '../repositories/role.repository.js';
import * as usuarioRepo from '../repositories/usuario.repository.js';
import type { ContextoRequisicao } from '../types/context.js';
import { montarPaginado, type ResultadoPaginado } from '../utils/http.js';
import { hashSenha } from '../utils/password.js';
import { resolverPaginacao } from '../utils/pagination.js';
import * as auditoria from './auditoria.service.js';

export interface UsuarioDTO {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  cargo: { id: number; nome: string } | null;
  roles: string[];
}

export interface UsuarioAtribuivelDTO {
  id: number;
  nome: string;
  cargo: string | null;
}

function toDTO(usuario: Usuario): UsuarioDTO {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    ativo: usuario.ativo,
    cargo: usuario.cargo
      ? { id: usuario.cargo.id, nome: usuario.cargo.nome }
      : null,
    roles: (usuario.roles ?? []).map((role) => role.nome),
  };
}

export async function listar(input: {
  busca?: string;
  ativo?: boolean;
  pagina: number;
  tamanhoPagina: number;
}): Promise<ResultadoPaginado<UsuarioDTO>> {
  const { offset, limit, pagina, tamanhoPagina } = resolverPaginacao(input);
  const filtro: usuarioRepo.FiltroUsuario = {};
  if (input.busca) {
    filtro.busca = input.busca;
  }
  if (input.ativo !== undefined) {
    filtro.ativo = input.ativo;
  }
  const { itens, total } = await usuarioRepo.listar(filtro, offset, limit);
  return montarPaginado(itens.map(toDTO), total, pagina, tamanhoPagina);
}

export async function buscarPorId(id: number): Promise<UsuarioDTO> {
  const usuario = await usuarioRepo.buscarPorId(id);
  if (!usuario) {
    throw new NotFoundError('Usuário não encontrado.');
  }
  return toDTO(usuario);
}

/**
 * Lista usuários ativos para atribuição de responsável em processos e etapas.
 * Não exige `usuarios.read`: a permissão de atribuição é suficiente.
 */
export async function listarAtribuiveis(): Promise<UsuarioAtribuivelDTO[]> {
  const usuarios = await usuarioRepo.listarAtivos();
  return usuarios.map((usuario) => ({
    id: usuario.id,
    nome: usuario.nome,
    cargo: usuario.cargo?.nome ?? null,
  }));
}

async function validarRoles(roleIds: readonly number[]): Promise<void> {
  if (roleIds.length === 0) {
    return;
  }
  const roles = await roleRepo.buscarPorIds(roleIds);
  if (roles.length !== new Set(roleIds).size) {
    throw new ValidationError('Um ou mais papéis informados não existem.');
  }
}

export async function criar(
  input: {
    nome: string;
    email: string;
    senha: string;
    cargoId?: number | null;
    roleIds?: number[];
    ativo?: boolean;
  },
  contexto: ContextoRequisicao,
): Promise<UsuarioDTO> {
  const email = normalizarEmail(input.email);
  const existente = await usuarioRepo.buscarPorEmail(email);
  if (existente) {
    throw new ConflictError('Já existe um usuário com este e-mail.');
  }
  const roleIds = input.roleIds ?? [];
  await validarRoles(roleIds);
  const senhaHash = await hashSenha(input.senha);

  const usuario = await sequelize.transaction(async (transaction) => {
    const criado = await usuarioRepo.criar(
      {
        nome: normalizarNome(input.nome),
        email,
        senhaHash,
        cargoId: input.cargoId ?? null,
        ativo: input.ativo ?? true,
        senhaProvisoria: true,
      },
      transaction,
    );
    if (roleIds.length > 0) {
      await usuarioRepo.definirRoles(
        criado.id,
        roleIds,
        contexto.usuarioId,
        transaction,
      );
    }
    return criado;
  });

  await auditoria.registrar(contexto, {
    acao: 'CRIAR',
    recurso: 'usuario',
    recursoId: usuario.id,
    metadados: { nome: usuario.nome, email: usuario.email },
  });
  return buscarPorId(usuario.id);
}

export async function atualizar(
  id: number,
  input: {
    nome?: string;
    email?: string;
    cargoId?: number | null;
    ativo?: boolean;
  },
  contexto: ContextoRequisicao,
): Promise<UsuarioDTO> {
  const usuario = await usuarioRepo.buscarPorId(id);
  if (!usuario) {
    throw new NotFoundError('Usuário não encontrado.');
  }
  if (input.email !== undefined) {
    const email = normalizarEmail(input.email);
    const existente = await usuarioRepo.buscarPorEmail(email);
    if (existente && existente.id !== id) {
      throw new ConflictError('Já existe um usuário com este e-mail.');
    }
    usuario.email = email;
  }
  if (input.nome !== undefined) {
    usuario.nome = normalizarNome(input.nome);
  }
  if (input.cargoId !== undefined) {
    usuario.cargoId = input.cargoId;
  }
  if (input.ativo !== undefined) {
    usuario.ativo = input.ativo;
  }
  await usuario.save();
  await auditoria.registrar(contexto, {
    acao: 'ALTERAR',
    recurso: 'usuario',
    recursoId: usuario.id,
    metadados: {
      nome: usuario.nome,
      email: usuario.email,
      campos: Object.keys(input),
    },
  });
  return buscarPorId(usuario.id);
}

export async function definirRoles(
  id: number,
  roleIds: readonly number[],
  contexto: ContextoRequisicao,
): Promise<UsuarioDTO> {
  const usuario = await usuarioRepo.buscarPorId(id);
  if (!usuario) {
    throw new NotFoundError('Usuário não encontrado.');
  }
  await validarRoles(roleIds);
  await sequelize.transaction(async (transaction) => {
    await usuarioRepo.definirRoles(
      id,
      roleIds,
      contexto.usuarioId,
      transaction,
    );
  });
  const roles =
    roleIds.length > 0 ? await roleRepo.buscarPorIds(roleIds) : [];
  await auditoria.registrar(contexto, {
    acao: 'DEFINIR_ROLES',
    recurso: 'usuario',
    recursoId: id,
    metadados: {
      usuario: usuario.nome,
      papeis: roles.map((role) => role.nome),
    },
  });
  return buscarPorId(id);
}

export async function desativar(
  id: number,
  contexto: ContextoRequisicao,
): Promise<UsuarioDTO> {
  const usuario = await usuarioRepo.buscarPorId(id);
  if (!usuario) {
    throw new NotFoundError('Usuário não encontrado.');
  }
  usuario.ativo = false;
  await usuario.save();
  await auditoria.registrar(contexto, {
    acao: 'DESATIVAR',
    recurso: 'usuario',
    recursoId: id,
  });
  return buscarPorId(id);
}
