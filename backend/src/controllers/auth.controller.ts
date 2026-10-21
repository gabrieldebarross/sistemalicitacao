import type { Request, Response } from 'express';

import {
  alterarSenhaSchema,
  atualizarPerfilSchema,
  loginSchema,
  mfaCodigoSchema,
  sessaoIdParamSchema,
} from '../schemas/index.js';
import * as authService from '../services/auth.service.js';
import * as sessaoService from '../services/sessao.service.js';
import {
  contextoDe,
  usuarioAutenticado,
} from '../utils/contexto.js';
import {
  AUTH_COOKIE,
  MFA_COOKIE,
  REFRESH_COOKIE,
  definirCookieDesafioMfa,
  definirCookiesSessao,
  getCookie,
  limparCookieDesafioMfa,
  limparCookiesSessao,
} from '../utils/cookies.js';
import {
  AuthenticationError,
  ConflictError,
  MfaChallengeError,
} from '../errors/app-error.js';
import { responderOk } from '../utils/http.js';
import { verificarAccessToken, verificarDesafioMfa } from '../utils/jwt.js';
import { validar } from '../utils/validation.js';

function sessaoIdDoRefresh(token: string | undefined): string | undefined {
  if (!token) {
    return undefined;
  }
  const separador = token.indexOf('.');
  return separador > 0 ? token.slice(0, separador) : undefined;
}

function exigirDesafio(req: Request): {
  sub: number;
  sid: string;
  setup: boolean;
} {
  const token = getCookie(req, MFA_COOKIE);
  const desafio = token ? verificarDesafioMfa(token) : null;
  if (!desafio) {
    throw new MfaChallengeError(
      'Desafio de MFA expirado. Faça login novamente.',
    );
  }
  return desafio;
}

export async function login(req: Request, res: Response): Promise<void> {
  const dados = validar(loginSchema, req.body);
  const resultado = await authService.login(
    dados.email,
    dados.senha,
    contextoDe(req, res),
  );

  if (resultado.tipo === 'MFA') {
    limparCookiesSessao(res);
    definirCookieDesafioMfa(res, resultado.desafio);
    responderOk(res, {
      mfaRequerido: true,
      configuracaoMfa: resultado.configuracao,
    });
    return;
  }

  const csrfToken = definirCookiesSessao(
    res,
    resultado.accessToken,
    resultado.refreshToken,
  );
  responderOk(res, { perfil: resultado.perfil, csrfToken });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = getCookie(req, REFRESH_COOKIE);
  if (!token) {
    limparCookiesSessao(res);
    throw new AuthenticationError('Sessão expirada. Faça login novamente.');
  }
  const resultado = await sessaoService.rotacionarRefreshToken(token);
  if (!resultado) {
    limparCookiesSessao(res);
    throw new AuthenticationError('Sessão expirada. Faça login novamente.');
  }
  const csrfToken = definirCookiesSessao(
    res,
    resultado.tokens.accessToken,
    resultado.tokens.refreshToken,
  );
  responderOk(res, {
    perfil: await authService.perfilAtual(resultado.usuario.id),
    csrfToken,
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const access = getCookie(req, AUTH_COOKIE);
  const acesso = access ? verificarAccessToken(access) : null;
  const sessaoId =
    acesso?.sid ?? sessaoIdDoRefresh(getCookie(req, REFRESH_COOKIE));
  await authService.logout(sessaoId, contextoDe(req, res));
  limparCookiesSessao(res);
  responderOk(res, { mensagem: 'Sessão encerrada.' });
}

export async function me(req: Request, res: Response): Promise<void> {
  const perfil = await authService.perfilAtual(usuarioAutenticado(req));
  responderOk(res, perfil);
}

export async function atualizarPerfil(
  req: Request,
  res: Response,
): Promise<void> {
  const dados = validar(atualizarPerfilSchema, req.body);
  const perfil = await authService.atualizarPerfil(
    usuarioAutenticado(req),
    dados,
    contextoDe(req, res),
  );
  responderOk(res, perfil);
}

export async function alterarSenha(
  req: Request,
  res: Response,
): Promise<void> {
  const dados = validar(alterarSenhaSchema, req.body);
  await authService.alterarSenha(
    usuarioAutenticado(req),
    dados.senhaAtual,
    dados.novaSenha,
    contextoDe(req, res),
    req.autenticacao?.sessaoId,
  );
  responderOk(res, { mensagem: 'Senha alterada com sucesso.' });
}

/**
 * Executa um passo de MFA. Quando o desafio deixa de ser válido, remove os
 * cookies de desafio e de sessão para que o navegador volte ao login.
 */
async function executarPassoMfa(
  res: Response,
  passo: () => Promise<void>,
): Promise<void> {
  try {
    await passo();
  } catch (erro) {
    if (erro instanceof MfaChallengeError) {
      limparCookiesSessao(res);
    }
    throw erro;
  }
}

export async function iniciarMfa(
  req: Request,
  res: Response,
): Promise<void> {
  await executarPassoMfa(res, async () => {
    const desafio = exigirDesafio(req);
    if (!desafio.setup) {
      throw new ConflictError('MFA já está configurado para este usuário.');
    }
    const configuracao = await authService.iniciarConfiguracaoMfa(
      desafio.sid,
      desafio.sub,
    );
    responderOk(res, configuracao);
  });
}

export async function confirmarMfa(
  req: Request,
  res: Response,
): Promise<void> {
  await executarPassoMfa(res, async () => {
    const desafio = exigirDesafio(req);
    if (!desafio.setup) {
      throw new ConflictError('Esta sessão não está em configuração de MFA.');
    }
    const { codigo } = validar(mfaCodigoSchema, req.body);
    const resultado = await authService.confirmarConfiguracaoMfa(
      desafio.sid,
      desafio.sub,
      codigo,
      contextoDe(req, res),
    );
    const csrfToken = definirCookiesSessao(
      res,
      resultado.accessToken,
      resultado.refreshToken,
    );
    limparCookieDesafioMfa(res);
    responderOk(res, {
      perfil: resultado.perfil,
      csrfToken,
      codigosRecuperacao: resultado.codigosRecuperacao,
    });
  });
}

export async function verificarMfa(
  req: Request,
  res: Response,
): Promise<void> {
  await executarPassoMfa(res, async () => {
    const desafio = exigirDesafio(req);
    if (desafio.setup) {
      throw new ConflictError('Conclua a configuração de MFA antes de entrar.');
    }
    const { codigo } = validar(mfaCodigoSchema, req.body);
    const resultado = await authService.verificarDesafioMfa(
      desafio.sid,
      desafio.sub,
      codigo,
      contextoDe(req, res),
    );
    const csrfToken = definirCookiesSessao(
      res,
      resultado.accessToken,
      resultado.refreshToken,
    );
    limparCookieDesafioMfa(res);
    responderOk(res, { perfil: resultado.perfil, csrfToken });
  });
}

export async function listarSessoes(
  req: Request,
  res: Response,
): Promise<void> {
  const sessoes = await sessaoService.listarSessoes(
    usuarioAutenticado(req),
    req.autenticacao?.sessaoId,
  );
  responderOk(res, sessoes);
}

export async function revogarSessao(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validar(sessaoIdParamSchema, req.params);
  await sessaoService.revogarSessaoDoUsuario(id, usuarioAutenticado(req));
  responderOk(res, { mensagem: 'Sessão revogada.' });
}
