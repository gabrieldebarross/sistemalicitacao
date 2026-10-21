import { env } from '../config/env.js';
import { AuthenticationError, ConflictError } from '../errors/app-error.js';
import { normalizarEmail, normalizarNome } from '../domain/normalization.js';
import type { Sessao } from '../models/sessao.js';
import * as sessaoRepo from '../repositories/sessao.repository.js';
import * as usuarioRepo from '../repositories/usuario.repository.js';
import type { ContextoRequisicao } from '../types/context.js';
import { assinarDesafioMfa } from '../utils/jwt.js';
import { verificarSenha } from '../utils/password.js';
import * as auditoria from './auditoria.service.js';
import * as mfaService from './mfa.service.js';
import * as senhaService from './senha.service.js';
import * as sessaoService from './sessao.service.js';

export interface PerfilUsuario {
  id: number;
  nome: string;
  email: string;
  cargo: { id: number; nome: string } | null;
  ativo: boolean;
  senhaProvisoria: boolean;
  mfaAtivo: boolean;
  roles: string[];
  permissoes: string[];
}

export interface ResultadoLogin {
  tipo: 'LOGIN';
  accessToken: string;
  refreshToken: string;
  perfil: PerfilUsuario;
}

export interface ResultadoDesafioMfa {
  tipo: 'MFA';
  desafio: string;
  configuracao: boolean;
}

export interface ResultadoMfaConcluido {
  accessToken: string;
  refreshToken: string;
  perfil: PerfilUsuario;
  codigosRecuperacao?: string[];
}

export type ResultadoAutenticacao = ResultadoLogin | ResultadoDesafioMfa;

const MFA_MAX_TENTATIVAS = 5;

function montarPerfil(
  dados: usuarioRepo.UsuarioAutenticacao,
): PerfilUsuario {
  const { usuario, permissoes, roles } = dados;
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    cargo: usuario.cargo
      ? { id: usuario.cargo.id, nome: usuario.cargo.nome }
      : null,
    ativo: usuario.ativo,
    senhaProvisoria: usuario.senhaProvisoria,
    mfaAtivo: usuario.mfaAtivo,
    roles,
    permissoes: [...permissoes].sort(),
  };
}

async function registrarFalhaLogin(
  usuarioId: number | null,
  contexto: ContextoRequisicao,
): Promise<void> {
  await auditoria.registrar(
    usuarioId ? { ...contexto, usuarioId } : contexto,
    {
      acao: 'LOGIN',
      recurso: 'sessao',
      recursoId: usuarioId,
      resultado: 'FALHA',
    },
  );
}

/**
 * Autentica e-mail/senha. Mensagens genéricas evitam enumeração de usuários.
 * Quando MFA é exigido, retorna um desafio de curta duração em vez de sessão.
 */
export async function login(
  email: string,
  senha: string,
  contexto: ContextoRequisicao,
): Promise<ResultadoAutenticacao> {
  const usuario = await usuarioRepo.buscarPorEmail(normalizarEmail(email));
  const agora = new Date();

  if (!usuario || !usuario.ativo) {
    await registrarFalhaLogin(null, contexto);
    throw new AuthenticationError('Credenciais inválidas.');
  }

  if (usuario.bloqueadoAte && usuario.bloqueadoAte > agora) {
    await registrarFalhaLogin(usuario.id, contexto);
    throw new AuthenticationError('Credenciais inválidas.');
  }
  if (usuario.bloqueadoAte && usuario.bloqueadoAte <= agora) {
    usuario.bloqueadoAte = null;
    usuario.tentativasFalhas = 0;
  }

  const senhaConfere = await verificarSenha(senha, usuario.senhaHash);
  if (!senhaConfere) {
    usuario.tentativasFalhas += 1;
    if (usuario.tentativasFalhas >= env.login.maxAttempts) {
      usuario.bloqueadoAte = new Date(
        Date.now() + env.login.lockMinutes * 60_000,
      );
      usuario.tentativasFalhas = 0;
    }
    await usuario.save();
    await registrarFalhaLogin(usuario.id, contexto);
    throw new AuthenticationError('Credenciais inválidas.');
  }

  usuario.tentativasFalhas = 0;
  usuario.bloqueadoAte = null;
  usuario.ultimoAcessoEm = agora;
  await usuario.save();

  const dados = await usuarioRepo.buscarParaAutenticacao(usuario.id);
  if (!dados) {
    throw new AuthenticationError('Credenciais inválidas.');
  }

  if (mfaService.precisaVerificarMfa(usuario, dados.permissoes)) {
    const setup = !usuario.mfaAtivo;
    const desafio = await sessaoService.criarDesafioMfa(
      usuario,
      setup,
      contexto,
    );
    await auditoria.registrar(
      { ...contexto, usuarioId: usuario.id },
      {
        acao: setup ? 'MFA_CONFIGURACAO_INICIADA' : 'LOGIN_MFA',
        recurso: 'sessao',
        recursoId: dados.usuario.id,
        resultado: 'SUCESSO',
      },
    );
    return {
      tipo: 'MFA',
      desafio: assinarDesafioMfa({
        sub: usuario.id,
        sid: desafio.sessao.id,
        setup,
      }),
      configuracao: setup,
    };
  }

  const tokens = await sessaoService.criarSessaoAtiva(usuario, contexto);
  await auditoria.registrar(
    { ...contexto, usuarioId: usuario.id },
    {
      acao: 'LOGIN',
      recurso: 'sessao',
      recursoId: usuario.id,
      resultado: 'SUCESSO',
    },
  );
  return {
    tipo: 'LOGIN',
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    perfil: montarPerfil(dados),
  };
}

export async function perfilAtual(
  usuarioId: number,
): Promise<PerfilUsuario> {
  const dados = await usuarioRepo.buscarParaAutenticacao(usuarioId);
  if (!dados || !dados.usuario.ativo) {
    throw new AuthenticationError('Sessão inválida.');
  }
  return montarPerfil(dados);
}

export async function alterarSenha(
  usuarioId: number,
  senhaAtual: string,
  novaSenha: string,
  contexto: ContextoRequisicao,
  sessaoAtualId?: string,
): Promise<void> {
  const usuario = await usuarioRepo.buscarPorId(usuarioId);
  if (!usuario || !usuario.ativo) {
    throw new AuthenticationError('Sessão inválida.');
  }
  const confere = await verificarSenha(senhaAtual, usuario.senhaHash);
  if (!confere) {
    await auditoria.registrar(contexto, {
      acao: 'ALTERAR_SENHA',
      recurso: 'usuario',
      recursoId: usuarioId,
      resultado: 'FALHA',
      metadados: { nome: usuario.nome, email: usuario.email },
    });
    throw new AuthenticationError('Senha atual inválida.');
  }
  const novoHash = await senhaService.validarPoliticaSenha(
    usuario,
    novaSenha,
  );
  usuario.senhaHash = novoHash;
  usuario.senhaProvisoria = false;
  usuario.tentativasFalhas = 0;
  usuario.bloqueadoAte = null;
  await usuario.save();
  await senhaService.registrarSenha(usuarioId, novoHash);
  await sessaoService.revogarTodasDoUsuario(usuarioId, sessaoAtualId);
  await auditoria.registrar(contexto, {
    acao: 'ALTERAR_SENHA',
    recurso: 'usuario',
    recursoId: usuarioId,
    resultado: 'SUCESSO',
    metadados: { nome: usuario.nome, email: usuario.email },
  });
}

/**
 * Atualiza os dados pessoais do próprio usuário autenticado. Papéis, cargo e
 * situação administrativa não podem ser alterados por esta via.
 */
export async function atualizarPerfil(
  usuarioId: number,
  input: { nome?: string; email?: string },
  contexto: ContextoRequisicao,
): Promise<PerfilUsuario> {
  const usuario = await usuarioRepo.buscarPorId(usuarioId);
  if (!usuario || !usuario.ativo) {
    throw new AuthenticationError('Sessão inválida.');
  }

  if (input.email !== undefined) {
    const email = normalizarEmail(input.email);
    const existente = await usuarioRepo.buscarPorEmail(email);
    if (existente && existente.id !== usuarioId) {
      throw new ConflictError('Já existe um usuário com este e-mail.');
    }
    usuario.email = email;
  }
  if (input.nome !== undefined) {
    usuario.nome = normalizarNome(input.nome);
  }
  await usuario.save();

  await auditoria.registrar(contexto, {
    acao: 'ALTERAR',
    recurso: 'usuario',
    recursoId: usuarioId,
    metadados: {
      nome: usuario.nome,
      email: usuario.email,
      campos: Object.keys(input),
      origem: 'perfil',
    },
  });

  return perfilAtual(usuarioId);
}

async function carregarDesafio(
  sessaoId: string,
  usuarioId: number,
): Promise<{ sessao: Sessao; usuario: usuarioRepo.UsuarioAutenticacao }> {
  const sessao = await sessaoRepo.buscarPorId(sessaoId);
  if (
    !sessao ||
    sessao.usuarioId !== usuarioId ||
    sessao.estado !== 'MFA_PENDENTE' ||
    sessao.revogadaEm !== null ||
    sessao.expiraEm <= new Date()
  ) {
    throw new AuthenticationError('Desafio de MFA expirado. Faça login novamente.');
  }
  const usuario = await usuarioRepo.buscarParaAutenticacao(usuarioId);
  if (!usuario || !usuario.usuario.ativo) {
    throw new AuthenticationError('Credenciais inválidas.');
  }
  return { sessao, usuario };
}

export async function iniciarConfiguracaoMfa(
  sessaoId: string,
  usuarioId: number,
): Promise<mfaService.ConfiguracaoMfa> {
  const { sessao, usuario } = await carregarDesafio(sessaoId, usuarioId);
  if (!sessao.mfaConfiguracaoPendente || usuario.usuario.mfaAtivo) {
    throw new ConflictError('Configuração de MFA não permitida para esta sessão.');
  }
  return mfaService.iniciarConfiguracao(usuario.usuario);
}

export async function confirmarConfiguracaoMfa(
  sessaoId: string,
  usuarioId: number,
  codigo: string,
  contexto: ContextoRequisicao,
): Promise<ResultadoMfaConcluido> {
  const { sessao, usuario } = await carregarDesafio(sessaoId, usuarioId);
  if (!sessao.mfaConfiguracaoPendente) {
    throw new ConflictError('Esta sessão não está em configuração de MFA.');
  }
  if (sessao.mfaTentativas >= MFA_MAX_TENTATIVAS) {
    await sessaoService.revogarSessao(sessao.id);
    await auditoria.registrar(contexto, {
      acao: 'MFA_CONFIGURAR',
      recurso: 'usuario',
      recursoId: usuarioId,
      resultado: 'FALHA',
      metadados: { motivo: 'LIMITE_TENTATIVAS' },
    });
    throw new AuthenticationError(
      'Muitas tentativas de configuração. Faça login novamente.',
    );
  }
  let resultado: Awaited<ReturnType<typeof mfaService.confirmarConfiguracao>>;
  try {
    resultado = await mfaService.confirmarConfiguracao(usuario.usuario, codigo);
  } catch (erro) {
    sessao.mfaTentativas += 1;
    await sessao.save();
    if (sessao.mfaTentativas >= MFA_MAX_TENTATIVAS) {
      await sessaoService.revogarSessao(sessao.id);
    }
    await auditoria.registrar(contexto, {
      acao: 'MFA_CONFIGURAR',
      recurso: 'usuario',
      recursoId: usuarioId,
      resultado: 'FALHA',
      metadados: { motivo: 'CODIGO_INVALIDO' },
    });
    throw erro;
  }
  const tokens = await sessaoService.ativarSessaoMfa(
    sessao,
    usuario.usuario,
  );
  await sessaoRepo.atualizar(sessao, { mfaConfiguracaoPendente: false });
  const perfil = await perfilAtual(usuarioId);
  await auditoria.registrar(contexto, {
    acao: 'MFA_CONFIGURAR',
    recurso: 'usuario',
    recursoId: usuarioId,
    resultado: 'SUCESSO',
    metadados: { usuario: usuario.usuario.nome },
  });
  return { ...tokens, perfil, codigosRecuperacao: resultado.codigosRecuperacao };
}

export async function verificarDesafioMfa(
  sessaoId: string,
  usuarioId: number,
  codigo: string,
  contexto: ContextoRequisicao,
): Promise<ResultadoMfaConcluido> {
  const { sessao, usuario } = await carregarDesafio(sessaoId, usuarioId);
  if (sessao.mfaConfiguracaoPendente) {
    throw new ConflictError('Conclua a configuração de MFA antes de entrar.');
  }
  if (sessao.mfaTentativas >= MFA_MAX_TENTATIVAS) {
    await sessaoService.revogarSessao(sessao.id);
    await auditoria.registrar(contexto, {
      acao: 'LOGIN_MFA',
      recurso: 'sessao',
      recursoId: usuarioId,
      resultado: 'FALHA',
      metadados: { motivo: 'LIMITE_TENTATIVAS' },
    });
    throw new AuthenticationError(
      'Muitas tentativas de verificação. Faça login novamente.',
    );
  }
  const tipo = await mfaService.verificarCodigo(usuario.usuario, codigo);
  if (!tipo) {
    sessao.mfaTentativas += 1;
    await sessao.save();
    if (sessao.mfaTentativas >= MFA_MAX_TENTATIVAS) {
      await sessaoService.revogarSessao(sessao.id);
    }
    await auditoria.registrar(contexto, {
      acao: 'LOGIN_MFA',
      recurso: 'sessao',
      recursoId: usuarioId,
      resultado: 'FALHA',
    });
    throw new AuthenticationError('Código de verificação inválido.');
  }
  const tokens = await sessaoService.ativarSessaoMfa(
    sessao,
    usuario.usuario,
  );
  const perfil = await perfilAtual(usuarioId);
  await auditoria.registrar(contexto, {
    acao: 'LOGIN_MFA',
    recurso: 'sessao',
    recursoId: usuarioId,
    resultado: 'SUCESSO',
    metadados: { metodo: tipo },
  });
  return { ...tokens, perfil };
}

export async function logout(
  sessaoId: string | undefined,
  contexto: ContextoRequisicao,
): Promise<void> {
  if (sessaoId) {
    await sessaoService.revogarSessao(sessaoId);
    await auditoria.registrar(contexto, {
      acao: 'LOGOUT',
      recurso: 'sessao',
      recursoId: sessaoId,
      resultado: 'SUCESSO',
    });
  }
}
