import { sequelize } from '../config/database.js';
import {
  NotFoundError,
  ValidationError,
} from '../errors/app-error.js';
import type { Permission } from '../models/permission.js';
import type { Role } from '../models/role.js';
import * as permissionRepo from '../repositories/permission.repository.js';
import * as roleRepo from '../repositories/role.repository.js';
import type { ContextoRequisicao } from '../types/context.js';
import * as auditoria from './auditoria.service.js';

export interface PermissionDTO {
  id: number;
  codigo: string;
  descricao: string | null;
}

export interface RoleDTO {
  id: number;
  nome: string;
  descricao: string | null;
  permissoes: PermissionDTO[];
}

function toPermissionDTO(permission: Permission): PermissionDTO {
  return {
    id: permission.id,
    codigo: permission.codigo,
    descricao: permission.descricao,
  };
}

function toDTO(role: Role): RoleDTO {
  return {
    id: role.id,
    nome: role.nome,
    descricao: role.descricao,
    permissoes: (role.permissions ?? []).map(toPermissionDTO),
  };
}

export async function listar(): Promise<RoleDTO[]> {
  const roles = await roleRepo.listarComPermissoes();
  return roles.map(toDTO);
}

export async function buscarPorId(id: number): Promise<RoleDTO> {
  const role = await roleRepo.buscarPorId(id);
  if (!role) {
    throw new NotFoundError('Papel não encontrado.');
  }
  return {
    id: role.id,
    nome: role.nome,
    descricao: role.descricao,
    permissoes: [],
  };
}

export async function listarPermissoes(): Promise<PermissionDTO[]> {
  const permissoes = await permissionRepo.listar();
  return permissoes.map(toPermissionDTO);
}

export async function definirPermissoes(
  roleId: number,
  permissionIds: readonly number[],
  contexto: ContextoRequisicao,
): Promise<RoleDTO> {
  const role = await roleRepo.buscarPorId(roleId);
  if (!role) {
    throw new NotFoundError('Papel não encontrado.');
  }

  const unicos = [...new Set(permissionIds)];
  let codigos: string[] = [];
  if (unicos.length > 0) {
    const permissoes = await Promise.all(
      unicos.map((id) => permissionRepo.buscarPorId(id)),
    );
    if (permissoes.some((permissao) => permissao === null)) {
      throw new ValidationError('Uma ou mais permissões não existem.');
    }
    codigos = permissoes
      .filter((permissao): permissao is Permission => permissao !== null)
      .map((permissao) => permissao.codigo);
  }

  await sequelize.transaction(async (transaction) => {
    await roleRepo.definirPermissoes(roleId, unicos, transaction);
  });

  await auditoria.registrar(contexto, {
    acao: 'DEFINIR_PERMISSOES',
    recurso: 'role',
    recursoId: roleId,
    metadados: { papel: role.nome, permissoes: codigos },
  });

  const roles = await roleRepo.listarComPermissoes();
  const atualizado = roles.find((item) => item.id === roleId);
  if (!atualizado) {
    throw new NotFoundError('Papel não encontrado.');
  }
  return toDTO(atualizado);
}

export async function atualizar(
  id: number,
  input: { descricao?: string | null },
  contexto: ContextoRequisicao,
): Promise<RoleDTO> {
  const role = await roleRepo.buscarPorId(id);
  if (!role) {
    throw new NotFoundError('Papel não encontrado.');
  }
  if (input.descricao !== undefined) {
    await roleRepo.atualizar(role, { descricao: input.descricao });
  }
  await auditoria.registrar(contexto, {
    acao: 'ALTERAR',
    recurso: 'role',
    recursoId: id,
    metadados: { papel: role.nome, descricao: input.descricao ?? null },
  });
  const roles = await roleRepo.listarComPermissoes();
  const atualizado = roles.find((item) => item.id === id);
  if (!atualizado) {
    throw new NotFoundError('Papel não encontrado.');
  }
  return toDTO(atualizado);
}
