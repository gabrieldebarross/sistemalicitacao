import { Op, type Transaction, type WhereOptions } from 'sequelize';

import { Cargo } from '../models/cargo.js';
import { Permission } from '../models/permission.js';
import { Role } from '../models/role.js';
import { Usuario } from '../models/usuario.js';
import { UserRole } from '../models/user-role.js';

export interface CriarUsuario {
  nome: string;
  email: string;
  senhaHash: string;
  cargoId: number | null;
  ativo?: boolean;
  senhaProvisoria?: boolean;
}

export interface FiltroUsuario {
  busca?: string;
  ativo?: boolean;
}

export async function criar(
  dados: CriarUsuario,
  transaction?: Transaction,
): Promise<Usuario> {
  return Usuario.create(dados, transaction ? { transaction } : {});
}

export async function buscarPorId(id: number): Promise<Usuario | null> {
  return Usuario.findByPk(id, {
    include: [
      { model: Cargo, as: 'cargo' },
      { model: Role, as: 'roles', through: { attributes: [] } },
    ],
  });
}

export async function buscarPorEmail(email: string): Promise<Usuario | null> {
  return Usuario.findOne({ where: { email } });
}

/** Usuários ativos com cargo, para seleção de responsáveis. */
export async function listarAtivos(): Promise<Usuario[]> {
  return Usuario.findAll({
    where: { ativo: true },
    include: [{ model: Cargo, as: 'cargo' }],
    order: [['nome', 'ASC']],
  });
}

export interface UsuarioAutenticacao {
  usuario: Usuario;
  permissoes: Set<string>;
  roles: string[];
}

/** Carrega usuário com papéis e permissões resolvidos para autorização. */
export async function buscarParaAutenticacao(
  id: number,
): Promise<UsuarioAutenticacao | null> {
  const usuario = await Usuario.findByPk(id, {
    include: [
      { model: Cargo, as: 'cargo' },
      {
        model: Role,
        as: 'roles',
        through: { attributes: [] },
        include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }],
      },
    ],
  });
  if (!usuario) {
    return null;
  }
  const roles = usuario.roles ?? [];
  const permissoes = new Set<string>();
  for (const role of roles) {
    for (const permissao of role.permissions ?? []) {
      permissoes.add(permissao.codigo);
    }
  }
  return {
    usuario,
    permissoes,
    roles: roles.map((role) => role.nome),
  };
}

export async function listar(
  filtro: FiltroUsuario,
  offset: number,
  limit: number,
): Promise<{ itens: Usuario[]; total: number }> {  const base: WhereOptions = {};
  if (filtro.ativo !== undefined) {
    base.ativo = filtro.ativo;
  }
  const where: WhereOptions = filtro.busca
    ? {
        ...base,
        [Op.or]: [
          { nome: { [Op.like]: `%${filtro.busca}%` } },
          { email: { [Op.like]: `%${filtro.busca}%` } },
        ],
      }
    : base;
  const { rows, count } = await Usuario.findAndCountAll({
    where,
    include: [
      { model: Cargo, as: 'cargo' },
      { model: Role, as: 'roles', through: { attributes: [] } },
    ],
    order: [['nome', 'ASC']],
    offset,
    limit,
    distinct: true,
  });
  return { itens: rows, total: count };
}

export async function atualizar(
  usuario: Usuario,
  dados: Partial<CriarUsuario> & { ultimoAcessoEm?: Date },
): Promise<Usuario> {
  return usuario.update(dados);
}

/** Substitui os papéis do usuário (dentro de uma transação). */
export async function definirRoles(
  usuarioId: number,
  roleIds: readonly number[],
  atribuidoPorId: number | null,
  transaction: Transaction,
): Promise<void> {
  await UserRole.destroy({ where: { usuarioId }, transaction });
  if (roleIds.length === 0) {
    return;
  }
  await UserRole.bulkCreate(
    roleIds.map((roleId) => ({ usuarioId, roleId, atribuidoPorId })),
    { transaction },
  );
}

export async function listarRoles(usuarioId: number): Promise<Role[]> {
  const vinculos = await UserRole.findAll({
    where: { usuarioId },
    include: [{ model: Role, as: 'role' }],
  });
  return vinculos
    .map((vinculo) => vinculo.role)
    .filter((role): role is Role => role !== undefined);
}
