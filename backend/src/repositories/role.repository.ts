import type { Transaction } from 'sequelize';

import { Permission } from '../models/permission.js';
import { Role } from '../models/role.js';
import { RolePermission } from '../models/role-permission.js';

export interface CriarRole {
  nome: string;
  descricao: string | null;
}

export async function criar(
  dados: CriarRole,
  transaction?: Transaction,
): Promise<Role> {
  return Role.create(dados, transaction ? { transaction } : {});
}

export async function buscarPorId(id: number): Promise<Role | null> {
  return Role.findByPk(id);
}

export async function buscarPorIds(ids: readonly number[]): Promise<Role[]> {
  if (ids.length === 0) {
    return [];
  }
  return Role.findAll({ where: { id: ids } });
}

export async function buscarPorNome(nome: string): Promise<Role | null> {
  return Role.findOne({ where: { nome } });
}

export async function listarComPermissoes(): Promise<Role[]> {
  return Role.findAll({
    include: [{ model: Permission, as: 'permissions' }],
    order: [['nome', 'ASC']],
  });
}

export async function listar(): Promise<Role[]> {
  return Role.findAll({ order: [['nome', 'ASC']] });
}

export async function atualizar(
  role: Role,
  dados: Partial<CriarRole>,
): Promise<Role> {
  return role.update(dados);
}

/** Substitui as permissões do papel (opera dentro de uma transação). */
export async function definirPermissoes(
  roleId: number,
  permissionIds: readonly number[],
  transaction: Transaction,
): Promise<void> {
  await RolePermission.destroy({ where: { roleId }, transaction });
  if (permissionIds.length === 0) {
    return;
  }
  await RolePermission.bulkCreate(
    permissionIds.map((permissionId) => ({ roleId, permissionId })),
    { transaction },
  );
}
