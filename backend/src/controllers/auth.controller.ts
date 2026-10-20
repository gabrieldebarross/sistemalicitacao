import type { Request, Response } from 'express';

import {
  alterarSenhaSchema,
  loginSchema,
} from '../schemas/index.js';
import * as authService from '../services/auth.service.js';
import {
  contextoDe,
  usuarioAutenticado,
} from '../utils/contexto.js';
import { definirCookiesSessao, limparCookiesSessao } from '../utils/cookies.js';
import { responderOk } from '../utils/http.js';
import { validar } from '../utils/validation.js';

export async function login(req: Request, res: Response): Promise<void> {
  const dados = validar(loginSchema, req.body);
  const resultado = await authService.login(
    dados.email,
    dados.senha,
    contextoDe(req, res),
  );
  const csrfToken = definirCookiesSessao(res, resultado.token);
  responderOk(res, { perfil: resultado.perfil, csrfToken });
}

export function logout(_req: Request, res: Response): void {
  limparCookiesSessao(res);
  responderOk(res, { mensagem: 'Sessão encerrada.' });
}

export async function me(req: Request, res: Response): Promise<void> {
  const perfil = await authService.perfilAtual(usuarioAutenticado(req));
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
  );
  responderOk(res, { mensagem: 'Senha alterada com sucesso.' });
}
