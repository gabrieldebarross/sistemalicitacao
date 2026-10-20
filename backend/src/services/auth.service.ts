import { AuthenticationError } from '../errors/app-error.js';
import { normalizarEmail } from '../domain/normalization.js';
import * as usuarioRepo from '../repositories/usuario.repository.js';
import type { ContextoRequisicao } from '../types/context.js';
import { assinarAccessToken } from '../utils/jwt.js';
import { hashSenha, verificarSenha } from '../utils/password.js';
import * as auditoria from './auditoria.service.js';

export interface PerfilUsuario {
  id: number;
  nome: string;
  email: string;
  cargo: { id: number; nome: string } | null;
  ativo: boolean;
  senhaProvisoria: boolean;
  roles: string[];
  permissoes: string[];
}

export interface ResultadoLogin {
  token: string;
  perfil: PerfilUsuario;
}

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
    roles,
    permissoes: [...permissoes].sort(),
  };
}

/**
 * Autentica e-mail/senha. Mensagens genéricas evitam enumeração de usuários.
 */
export async function login(
  email: string,
  senha: string,
  contexto: ContextoRequisicao,
): Promise<ResultadoLogin> {
  const usuario = await usuarioRepo.buscarPorEmail(normalizarEmail(email));

  if (!usuario || !usuario.ativo) {
    await auditoria.registrar(contexto, {
      acao: 'LOGIN',
      recurso: 'sessao',
      recursoId: null,
      resultado: 'FALHA',
    });
    throw new AuthenticationError('Credenciais inválidas.');
  }

  const senhaConfere = await verificarSenha(senha, usuario.senhaHash);
  if (!senhaConfere) {
    await auditoria.registrar(
      { ...contexto, usuarioId: usuario.id },
      {
        acao: 'LOGIN',
        recurso: 'sessao',
        recursoId: usuario.id,
        resultado: 'FALHA',
      },
    );
    throw new AuthenticationError('Credenciais inválidas.');
  }

  await usuarioRepo.atualizar(usuario, { ultimoAcessoEm: new Date() });
  const dados = await usuarioRepo.buscarParaAutenticacao(usuario.id);
  if (!dados) {
    throw new AuthenticationError('Credenciais inválidas.');
  }

  const token = assinarAccessToken({
    sub: usuario.id,
    email: usuario.email,
  });

  await auditoria.registrar(
    { ...contexto, usuarioId: usuario.id },
    {
      acao: 'LOGIN',
      recurso: 'sessao',
      recursoId: usuario.id,
      resultado: 'SUCESSO',
    },
  );

  return { token, perfil: montarPerfil(dados) };
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
    });
    throw new AuthenticationError('Senha atual inválida.');
  }
  const novoHash = await hashSenha(novaSenha);
  await usuarioRepo.atualizar(usuario, {
    senhaHash: novoHash,
    senhaProvisoria: false,
  });
  await auditoria.registrar(contexto, {
    acao: 'ALTERAR_SENHA',
    recurso: 'usuario',
    recursoId: usuarioId,
    resultado: 'SUCESSO',
  });
}
