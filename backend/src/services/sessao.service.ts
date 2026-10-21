import { randomUUID } from 'node:crypto';

import { env } from '../config/env.js';
import { ConflictError, NotFoundError } from '../errors/app-error.js';
import { Sessao } from '../models/sessao.js';
import type { Usuario } from '../models/usuario.js';
import * as sessaoRepo from '../repositories/sessao.repository.js';
import * as usuarioRepo from '../repositories/usuario.repository.js';
import type { ContextoRequisicao } from '../types/context.js';
import { duracaoParaMs } from '../utils/duration.js';
import { assinarAccessToken } from '../utils/jwt.js';
import { gerarTokenAleatorio, hashToken } from '../utils/security.js';

export interface TokensSessao {
  accessToken: string;
  refreshToken: string;
}

export interface SessaoDTO {
  id: string;
  criadaEm: Date;
  ultimoUsoEm: Date | null;
  expiraEm: Date;
  ip: string | null;
  userAgent: string | null;
  atual: boolean;
}

/**
 * Janela em que o refresh token imediatamente anterior ainda é aceito para
 * rotação. Evita logout indevido quando duas abas renovam ao mesmo tempo.
 * Fora dela, o token antigo é tratado como reutilização e revoga a sessão.
 */
const JANELA_REFRESH_CONCORRENTE_MS = 10_000;

function expiracaoRefresh(): Date {
  return new Date(Date.now() + duracaoParaMs(env.jwt.refreshExpiresIn));
}

function montarRefreshToken(sessaoId: string): {
  token: string;
  hash: string;
} {
  const segredo = gerarTokenAleatorio();
  const token = `${sessaoId}.${segredo}`;
  return { token, hash: hashToken(token) };
}

function separarRefreshToken(token: string): {
  sessaoId: string;
  token: string;
} | null {
  const separador = token.indexOf('.');
  if (separador <= 0 || separador === token.length - 1) {
    return null;
  }
  return {
    sessaoId: token.slice(0, separador),
    token,
  };
}

function emitirAccessToken(sessao: Sessao, usuario: Usuario): string {
  return assinarAccessToken({
    sub: usuario.id,
    email: usuario.email,
    sid: sessao.id,
  });
}

export async function criarSessaoAtiva(
  usuario: Usuario,
  contexto: ContextoRequisicao,
): Promise<TokensSessao & { sessao: Sessao }> {
  const id = randomUUID();
  const refresh = montarRefreshToken(id);
  const sessao = await sessaoRepo.criar({
    id,
    usuarioId: usuario.id,
    refreshTokenHash: refresh.hash,
    estado: 'ATIVA',
    expiraEm: expiracaoRefresh(),
    ip: contexto.ip,
    userAgent: (contexto.userAgent ?? '').slice(0, 255) || null,
  });
  return {
    sessao,
    accessToken: emitirAccessToken(sessao, usuario),
    refreshToken: refresh.token,
  };
}

export async function criarDesafioMfa(
  usuario: Usuario,
  setup: boolean,
  contexto: ContextoRequisicao,
): Promise<{ sessao: Sessao; expiraEm: Date }> {
  const id = randomUUID();
  const expiraEm = new Date(Date.now() + 10 * 60 * 1000);
  const sessao = await sessaoRepo.criar({
    id,
    usuarioId: usuario.id,
    refreshTokenHash: null,
    estado: 'MFA_PENDENTE',
    mfaConfiguracaoPendente: setup,
    expiraEm,
    ip: contexto.ip,
    userAgent: (contexto.userAgent ?? '').slice(0, 255) || null,
  });
  return { sessao, expiraEm };
}

export async function ativarSessaoMfa(
  sessao: Sessao,
  usuario: Usuario,
): Promise<TokensSessao> {
  const refresh = montarRefreshToken(sessao.id);
  await sessaoRepo.atualizar(sessao, {
    refreshTokenHash: refresh.hash,
    refreshTokenAnteriorHash: null,
    refreshRotacionadoEm: new Date(),
    estado: 'ATIVA',
    mfaConfiguracaoPendente: false,
    mfaTentativas: 0,
    expiraEm: expiracaoRefresh(),
    ultimoUsoEm: new Date(),
  });
  return {
    accessToken: emitirAccessToken(sessao, usuario),
    refreshToken: refresh.token,
  };
}

export async function rotacionarRefreshToken(
  token: string,
): Promise<{ tokens: TokensSessao; usuario: Usuario } | null> {
  const partes = separarRefreshToken(token);
  if (!partes) {
    return null;
  }
  const sessao = await sessaoRepo.buscarPorId(partes.sessaoId);
  if (
    !sessao ||
    sessao.estado !== 'ATIVA' ||
    sessao.revogadaEm !== null ||
    sessao.expiraEm <= new Date()
  ) {
    return null;
  }
  const hashAtual = hashToken(partes.token);
  const tokenAnteriorRecente =
    sessao.refreshTokenAnteriorHash !== null &&
    sessao.refreshTokenAnteriorHash === hashAtual &&
    sessao.refreshRotacionadoEm !== null &&
    Date.now() - sessao.refreshRotacionadoEm.getTime() <=
      JANELA_REFRESH_CONCORRENTE_MS;
  if (
    !sessao.refreshTokenHash ||
    (hashAtual !== sessao.refreshTokenHash && !tokenAnteriorRecente)
  ) {
    // Reutilização de refresh token fora da janela concorrente: revoga a
    // sessão inteira.
    await sessaoRepo.revogar(sessao.id, new Date());
    return null;
  }

  const usuario = await usuarioRepo.buscarPorId(sessao.usuarioId);
  if (!usuario || !usuario.ativo) {
    await sessaoRepo.revogar(sessao.id, new Date());
    return null;
  }

  const novo = montarRefreshToken(sessao.id);
  const hashBase = sessao.refreshTokenHash;
  const [afetadas] = await Sessao.update(
    {
      refreshTokenHash: novo.hash,
      // Na rotação concorrente, não mantém o hash antigo para sempre: ele só
      // pode ser usado uma vez dentro da janela.
      refreshTokenAnteriorHash: tokenAnteriorRecente ? null : hashAtual,
      refreshRotacionadoEm: new Date(),
      expiraEm: expiracaoRefresh(),
      ultimoUsoEm: new Date(),
    },
    {
      where: {
        id: sessao.id,
        refreshTokenHash: hashBase,
        revogadaEm: null,
        estado: 'ATIVA',
      },
    },
  );
  if (afetadas === 0) {
    // Outra requisição rotacionou entre a leitura e a escrita. Se o token
    // apresentado virou o hash anterior dentro da janela, tenta novamente para
    // atender a requisição concorrente sem encerrar a sessão.
    const atualizada = await sessaoRepo.buscarPorId(sessao.id);
    const podeRepetir =
      atualizada !== null &&
      atualizada.revogadaEm === null &&
      atualizada.refreshTokenAnteriorHash === hashAtual &&
      atualizada.refreshRotacionadoEm !== null &&
      Date.now() - atualizada.refreshRotacionadoEm.getTime() <=
        JANELA_REFRESH_CONCORRENTE_MS;
    if (podeRepetir) {
      return rotacionarRefreshToken(token);
    }
    return null;
  }

  return {
    tokens: {
      accessToken: emitirAccessToken(sessao, usuario),
      refreshToken: novo.token,
    },
    usuario,
  };
}

export async function revogarSessao(id: string): Promise<void> {
  await sessaoRepo.revogar(id, new Date());
}

export async function revogarSessaoDoUsuario(
  id: string,
  usuarioId: number,
): Promise<void> {
  const sessao = await sessaoRepo.buscarPorId(id);
  if (!sessao || sessao.usuarioId !== usuarioId) {
    throw new NotFoundError('Sessão não encontrada.');
  }
  await sessaoRepo.revogar(id, new Date());
}

export async function revogarTodasDoUsuario(
  usuarioId: number,
  excetoId?: string,
): Promise<number> {
  return sessaoRepo.revogarTodasDoUsuario(usuarioId, new Date(), excetoId);
}

export async function listarSessoes(
  usuarioId: number,
  sessaoAtualId?: string,
): Promise<SessaoDTO[]> {
  const sessoes = await sessaoRepo.listarAtivasPorUsuario(usuarioId, new Date());
  return sessoes.map((sessao) => ({
    id: sessao.id,
    criadaEm: sessao.createdAt,
    ultimoUsoEm: sessao.ultimoUsoEm,
    expiraEm: sessao.expiraEm,
    ip: sessao.ip,
    userAgent: sessao.userAgent,
    atual: sessao.id === sessaoAtualId,
  }));
}

export async function listarSessoesAdmin(
  usuarioId: number,
  sessaoAtualId?: string,
): Promise<SessaoDTO[]> {
  const usuario = await usuarioRepo.buscarPorId(usuarioId);
  if (!usuario) {
    throw new NotFoundError('Usuário não encontrado.');
  }
  return listarSessoes(usuarioId, sessaoAtualId);
}

export async function revogarSessaoAdmin(
  usuarioId: number,
  sessaoId: string,
): Promise<void> {
  const sessao = await sessaoRepo.buscarPorId(sessaoId);
  if (!sessao || sessao.usuarioId !== usuarioId) {
    throw new NotFoundError('Sessão não encontrada.');
  }
  await sessaoRepo.revogar(sessaoId, new Date());
}

export async function buscarSessaoAtiva(
  id: string,
): Promise<Sessao | null> {
  return sessaoRepo.buscarAtivaPorId(id, new Date());
}

export function exigirSessaoAtiva(sessao: Sessao | null): Sessao {
  if (!sessao) {
    throw new ConflictError('Sessão expirada ou revogada.');
  }
  return sessao;
}
