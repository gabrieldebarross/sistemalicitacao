import type { Transaction } from 'sequelize';

import { sequelize } from '../config/database.js';
import { normalizarEmail, normalizarNome } from '../domain/normalization.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../errors/app-error.js';
import type { Usuario } from '../models/usuario.js';
import * as movRepo from '../repositories/movimentacao.repository.js';
import * as processoRepo from '../repositories/processo.repository.js';
import * as roleRepo from '../repositories/role.repository.js';
import * as sessaoRepo from '../repositories/sessao.repository.js';
import * as setorRepo from '../repositories/setor.repository.js';
import * as usuarioRepo from '../repositories/usuario.repository.js';
import type { ContextoRequisicao } from '../types/context.js';
import { diffAuditoria } from '../utils/audit-diff.js';
import { montarPaginado, type ResultadoPaginado } from '../utils/http.js';
import { resolverPaginacao } from '../utils/pagination.js';
import { hashSenha } from '../utils/password.js';
import * as auditoria from './auditoria.service.js';
import * as mfaService from './mfa.service.js';
import * as senhaService from './senha.service.js';

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
  bloqueadoAte: Date | null;
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
    bloqueadoAte: usuario.bloqueadoAte,
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
    await senhaService.registrarSenha(criado.id, senhaHash, transaction);
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
  if (input.ativo === false && usuario.ativo) {
    throw new ValidationError(
      'Use a desativação de usuário para transferir atribuições e encerrar sessões.',
    );
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
  if (input.senha !== undefined) {
    const hash = await senhaService.validarPoliticaSenha(usuario, input.senha);
    usuario.senhaHash = hash;
    // Redefinição administrativa exige troca no próximo acesso.
    usuario.senhaProvisoria = true;
    usuario.tentativasFalhas = 0;
    usuario.bloqueadoAte = null;
  }
  await usuario.save();
  if (input.senha !== undefined) {
    await senhaService.registrarSenha(usuario.id, usuario.senhaHash);
    await sessaoRepo.revogarTodasDoUsuario(usuario.id, new Date());
  }
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

async function setorPrincipalDoUsuario(
  usuarioId: number,
  transaction?: Transaction,
): Promise<number | null> {
  const vinculos = await usuarioRepo.listarVinculosSetores(
    [usuarioId],
    transaction,
  );
  return (
    vinculos.find((vinculo) => vinculo.principal)?.setorId ??
    vinculos[0]?.setorId ??
    null
  );
}

export async function desativar(
  id: number,
  contexto: ContextoRequisicao,
  destinoUsuarioId?: number,
): Promise<UsuarioDTO> {
  if (contexto.usuarioId === id) {
    throw new ValidationError('Não é possível desativar o próprio usuário.');
  }
  const usuario = await usuarioRepo.buscarPorId(id);
  if (!usuario) {
    throw new NotFoundError('Usuário não encontrado.');
  }
  if (!usuario.ativo) {
    return buscarPorId(id);
  }

  let destino: Usuario | null = null;
  if (destinoUsuarioId !== undefined) {
    if (destinoUsuarioId === id) {
      throw new ValidationError(
        'O destino da transferência deve ser diferente do usuário desativado.',
      );
    }
    destino = await usuarioRepo.buscarPorId(destinoUsuarioId);
    if (!destino || !destino.ativo) {
      throw new ValidationError(
        'O usuário de destino da transferência não existe ou está inativo.',
      );
    }
  }

  const processosTransferidos: Array<{
    id: number;
    numero: string;
    nome: string;
  }> = [];
  const etapasTransferidas: Array<{
    processoId: number;
    etapaId: number;
    etapaNome: string;
  }> = [];
  let setorDestinoId: number | null = null;

  await sequelize.transaction(async (transaction) => {
    const processos = await processoRepo.listarAtribuidosAoUsuario(
      id,
      transaction,
    );
    const etapas = await processoRepo.listarEtapasAtivasDoUsuario(
      id,
      transaction,
    );

    if ((processos.length > 0 || etapas.length > 0) && !destino) {
      throw new ValidationError(
        'O usuário possui processos ou etapas atribuídos. Informe um usuário ativo de destino para a transferência.',
      );
    }

    if (destino) {
      setorDestinoId = await setorPrincipalDoUsuario(destino.id, transaction);
    }

    usuario.ativo = false;
    usuario.bloqueadoAte = null;
    usuario.tentativasFalhas = 0;
    await usuario.save({ transaction });

    if (destino) {
      for (const processo of processos) {
        processo.responsavelAtualId = destino.id;
        await processo.save({ transaction });
        processosTransferidos.push({
          id: processo.id,
          numero: processo.numero,
          nome: processo.nome,
        });
        await movRepo.criar(
          {
            processoId: processo.id,
            processoEtapaId: null,
            usuarioId: contexto.usuarioId,
            setorId: processo.setorAtualId,
            tipo: 'ALTERACAO',
            descricao: `Responsável do processo transferido de ${usuario.nome} para ${destino.nome} por desativação de usuário.`,
            metadados: {
              origem: 'DESATIVACAO_USUARIO',
              usuarioDesativadoId: id,
              usuarioDesativadoNome: usuario.nome,
              novoResponsavelId: destino.id,
              novoResponsavelNome: destino.nome,
            },
            correlacaoId: contexto.requestId || null,
          },
          transaction,
        );
      }

      for (const etapa of etapas) {
        const setorAnteriorId = etapa.setorId;
        etapa.responsavelId = destino.id;
        etapa.setorId = setorDestinoId;
        await etapa.save({ transaction });
        etapasTransferidas.push({
          processoId: etapa.processoId,
          etapaId: etapa.id,
          etapaNome: etapa.nome,
        });
        await movRepo.criar(
          {
            processoId: etapa.processoId,
            processoEtapaId: etapa.id,
            usuarioId: contexto.usuarioId,
            setorId: setorDestinoId,
            tipo: 'ALTERACAO',
            descricao: `Etapa "${etapa.nome}" transferida de ${usuario.nome} para ${destino.nome} por desativação de usuário.`,
            metadados: {
              origem: 'DESATIVACAO_USUARIO',
              etapaId: etapa.id,
              etapaNome: etapa.nome,
              usuarioDesativadoId: id,
              usuarioDesativadoNome: usuario.nome,
              novoResponsavelId: destino.id,
              novoResponsavelNome: destino.nome,
              setorAnteriorId,
              novoSetorId: setorDestinoId,
            },
            correlacaoId: contexto.requestId || null,
          },
          transaction,
        );
      }
    }

    await sessaoRepo.revogarTodasDoUsuario(
      id,
      new Date(),
      undefined,
      transaction,
    );
  });

  await auditoria.registrar(contexto, {
    acao: 'DESATIVAR',
    recurso: 'usuario',
    recursoId: id,
    metadados: {
      nome: usuario.nome,
      email: usuario.email,
      destinoUsuarioId: destino?.id ?? null,
      destinoUsuarioNome: destino?.nome ?? null,
      setorDestinoId,
      processosTransferidos,
      etapasTransferidas,
      sessoesRevogadas: true,
    },
  });
  return buscarPorId(id);
}

export async function desbloquear(
  id: number,
  contexto: ContextoRequisicao,
): Promise<UsuarioDTO> {
  const usuario = await usuarioRepo.buscarPorId(id);
  if (!usuario) {
    throw new NotFoundError('Usuário não encontrado.');
  }
  usuario.tentativasFalhas = 0;
  usuario.bloqueadoAte = null;
  await usuario.save();
  await auditoria.registrar(contexto, {
    acao: 'DESBLOQUEAR_LOGIN',
    recurso: 'usuario',
    recursoId: id,
    metadados: { nome: usuario.nome, email: usuario.email },
  });
  return buscarPorId(id);
}

export async function resetarMfa(
  id: number,
  contexto: ContextoRequisicao,
): Promise<UsuarioDTO> {
  if (contexto.usuarioId === id) {
    throw new ValidationError(
      'Use seus códigos de recuperação para redefinir o próprio MFA.',
    );
  }
  const usuario = await usuarioRepo.buscarPorId(id);
  if (!usuario) {
    throw new NotFoundError('Usuário não encontrado.');
  }
  await mfaService.resetarMfa(usuario);
  await sessaoRepo.revogarTodasDoUsuario(id, new Date());
  await auditoria.registrar(contexto, {
    acao: 'RESETAR_MFA',
    recurso: 'usuario',
    recursoId: id,
    metadados: { nome: usuario.nome, email: usuario.email },
  });
  return buscarPorId(id);
}
