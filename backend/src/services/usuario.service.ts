import { sequelize } from '../config/database.js';
import { normalizarEmail, normalizarNome } from '../domain/normalization.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../errors/app-error.js';
import type { Usuario } from '../models/usuario.js';
import * as roleRepo from '../repositories/role.repository.js';
import * as setorRepo from '../repositories/setor.repository.js';
import * as usuarioRepo from '../repositories/usuario.repository.js';
import type { ContextoRequisicao } from '../types/context.js';
import { diffAuditoria } from '../utils/audit-diff.js';
import { montarPaginado, type ResultadoPaginado } from '../utils/http.js';
import { hashSenha } from '../utils/password.js';
import { resolverPaginacao } from '../utils/pagination.js';
import * as auditoria from './auditoria.service.js';

export interface SetorUsuarioDTO {
  id: number;
  nome: string;
  sigla: string | null;
  principal: boolean;
}

export interface UsuarioDTO {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  cargo: { id: number; nome: string } | null;
  roles: string[];
  setores: SetorUsuarioDTO[];
}

export interface UsuarioAtribuivelDTO {
  id: number;
  nome: string;
  cargo: string | null;
  setores: SetorUsuarioDTO[];
  setorPrincipalId: number | null;
}

function setoresDoUsuario(
  usuarioId: number,
  vinculos: readonly usuarioRepo.VinculoSetorUsuario[],
): SetorUsuarioDTO[] {
  return vinculos
    .filter((vinculo) => vinculo.usuarioId === usuarioId)
    .map((vinculo) => ({
      id: vinculo.setor.id,
      nome: vinculo.setor.nome,
      sigla: vinculo.setor.sigla,
      principal: vinculo.principal,
    }))
    .sort(
      (a, b) =>
        Number(b.principal) - Number(a.principal) ||
        a.nome.localeCompare(b.nome),
    );
}

function setorPrincipalDe(setores: readonly SetorUsuarioDTO[]): number | null {
  return setores.find((setor) => setor.principal)?.id ?? null;
}

function toDTO(
  usuario: Usuario,
  vinculos: readonly usuarioRepo.VinculoSetorUsuario[],
): UsuarioDTO {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    ativo: usuario.ativo,
    cargo: usuario.cargo
      ? { id: usuario.cargo.id, nome: usuario.cargo.nome }
      : null,
    roles: (usuario.roles ?? []).map((role) => role.nome),
    setores: setoresDoUsuario(usuario.id, vinculos),
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
  const vinculos = await usuarioRepo.listarVinculosSetores(
    itens.map((usuario) => usuario.id),
  );
  return montarPaginado(
    itens.map((usuario) => toDTO(usuario, vinculos)),
    total,
    pagina,
    tamanhoPagina,
  );
}

export async function buscarPorId(id: number): Promise<UsuarioDTO> {
  const usuario = await usuarioRepo.buscarPorId(id);
  if (!usuario) {
    throw new NotFoundError('Usuário não encontrado.');
  }
  const vinculos = await usuarioRepo.listarVinculosSetores([id]);
  return toDTO(usuario, vinculos);
}

/**
 * Lista usuários ativos para atribuição de responsável em processos e etapas.
 * Não exige `usuarios.read`: a permissão de atribuição é suficiente.
 */
export async function listarAtribuiveis(): Promise<UsuarioAtribuivelDTO[]> {
  const usuarios = await usuarioRepo.listarAtivos();
  const vinculos = await usuarioRepo.listarVinculosSetores(
    usuarios.map((usuario) => usuario.id),
  );
  return usuarios.map((usuario) => {
    const setores = setoresDoUsuario(usuario.id, vinculos);
    return {
      id: usuario.id,
      nome: usuario.nome,
      cargo: usuario.cargo?.nome ?? null,
      setores,
      setorPrincipalId: setorPrincipalDe(setores),
    };
  });
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
    senha?: string;
    cargoId?: number | null;
    ativo?: boolean;
  },
  contexto: ContextoRequisicao,
): Promise<UsuarioDTO> {
  const usuario = await usuarioRepo.buscarPorId(id);
  if (!usuario) {
    throw new NotFoundError('Usuário não encontrado.');
  }
  const antes = {
    nome: usuario.nome,
    email: usuario.email,
    cargoId: usuario.cargoId,
    ativo: usuario.ativo,
    senhaHash: usuario.senhaHash,
  };
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
  if (input.senha !== undefined) {
    usuario.senhaHash = await hashSenha(input.senha);
    // Redefinição administrativa exige troca no próximo acesso.
    usuario.senhaProvisoria = true;
  }
  await usuario.save();
  const alteracoes = diffAuditoria(
    antes,
    {
      nome: usuario.nome,
      email: usuario.email,
      cargoId: usuario.cargoId,
      ativo: usuario.ativo,
      senhaHash: usuario.senhaHash,
    },
    ['nome', 'email', 'cargoId', 'ativo', 'senhaHash'],
  );
  await auditoria.registrar(contexto, {
    acao: 'ALTERAR',
    recurso: 'usuario',
    recursoId: usuario.id,
    metadados: {
      nome: usuario.nome,
      email: usuario.email,
      senhaRedefinida: input.senha !== undefined,
      alteracoes,
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

export async function definirSetores(
  id: number,
  input: { setorIds: number[]; setorPrincipalId?: number | null },
  contexto: ContextoRequisicao,
): Promise<UsuarioDTO> {
  const usuario = await usuarioRepo.buscarPorId(id);
  if (!usuario) {
    throw new NotFoundError('Usuário não encontrado.');
  }

  const setorIds = [...new Set(input.setorIds)];
  const setores = await setorRepo.buscarPorIds(setorIds);
  if (setores.length !== setorIds.length) {
    throw new ValidationError('Um ou mais setores informados não existem.');
  }
  if (setores.some((setor) => !setor.ativo)) {
    throw new ValidationError(
      'Não é possível vincular um usuário a um setor inativo.',
    );
  }

  const setorPrincipalId = input.setorPrincipalId ?? setorIds[0] ?? null;
  if (setorPrincipalId !== null && !setorIds.includes(setorPrincipalId)) {
    throw new ValidationError(
      'O setor principal deve estar entre os setores selecionados.',
    );
  }

  const antes = await usuarioRepo.listarVinculosSetores([id]);
  await sequelize.transaction(async (transaction) => {
    await usuarioRepo.definirSetores(
      id,
      setorIds,
      setorPrincipalId,
      transaction,
    );
  });
  const depois = await usuarioRepo.listarVinculosSetores([id]);

  const descrever = (
    vinculos: readonly usuarioRepo.VinculoSetorUsuario[],
  ): Array<{ id: number; nome: string; principal: boolean }> =>
    vinculos
      .filter((vinculo) => vinculo.usuarioId === id)
      .map((vinculo) => ({
        id: vinculo.setor.id,
        nome: vinculo.setor.nome,
        principal: vinculo.principal,
      }));

  await auditoria.registrar(contexto, {
    acao: 'DEFINIR_SETORES',
    recurso: 'usuario',
    recursoId: id,
    metadados: {
      usuario: usuario.nome,
      setoresAnteriores: descrever(antes),
      setoresNovos: descrever(depois),
      setorPrincipalId,
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
    metadados: { nome: usuario.nome, email: usuario.email },
  });
  return buscarPorId(id);
}
