import { beforeEach, describe, expect, it, vi } from 'vitest';

import { env } from '../../src/config/env.js';

const repositorioUsuario = {
  buscarPorEmail: vi.fn(),
  buscarParaAutenticacao: vi.fn(),
};

const repositorioSessao = {};

const servicoSessao = {
  criarDesafioMfa: vi.fn(),
  criarSessaoAtiva: vi.fn(),
};

const servicoMfa = {
  precisaVerificarMfa: vi.fn(),
};

const auditoria = {
  registrar: vi.fn(),
};

const senha = {
  verificarSenha: vi.fn(),
};

vi.mock('../../src/repositories/usuario.repository.js', () => repositorioUsuario);
vi.mock('../../src/repositories/sessao.repository.js', () => repositorioSessao);
vi.mock('../../src/services/sessao.service.js', () => servicoSessao);
vi.mock('../../src/services/mfa.service.js', () => servicoMfa);
vi.mock('../../src/services/senha.service.js', () => ({}));
vi.mock('../../src/services/auditoria.service.js', () => auditoria);
vi.mock('../../src/utils/password.js', () => senha);

const { login } = await import('../../src/services/auth.service.js');
const { AccountLockedError } = await import(
  '../../src/errors/app-error.js'
);

const contexto = {
  requestId: 'req-login-bloqueio',
  ip: '127.0.0.1',
  userAgent: 'vitest',
};

function criarUsuario(
  dados: Partial<{
    bloqueadoAte: Date | null;
    tentativasFalhas: number;
  }> = {},
) {
  return {
    id: 10,
    nome: 'Usuário Teste',
    email: 'usuario@example.com',
    ativo: true,
    senhaHash: 'hash',
    bloqueadoAte: dados.bloqueadoAte ?? null,
    tentativasFalhas: dados.tentativasFalhas ?? 0,
    ultimoAcessoEm: null as Date | null,
    mfaAtivo: false,
    senhaProvisoria: false,
    cargo: null,
    save: vi.fn().mockResolvedValue(undefined),
  };
}

describe('login com conta bloqueada', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    servicoMfa.precisaVerificarMfa.mockReturnValue(false);
    servicoSessao.criarSessaoAtiva.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    repositorioUsuario.buscarParaAutenticacao.mockResolvedValue({
      usuario: criarUsuario(),
      permissoes: new Set<string>(),
      roles: [],
    });
  });

  it('mantém mensagem genérica quando a senha está incorreta', async () => {
    const usuario = criarUsuario({
      bloqueadoAte: new Date(Date.now() + 10 * 60_000),
    });
    repositorioUsuario.buscarPorEmail.mockResolvedValue(usuario);
    senha.verificarSenha.mockResolvedValue(false);

    await expect(
      login('usuario@example.com', 'senha-errada', contexto),
    ).rejects.toMatchObject({
      codigo: 'NAO_AUTENTICADO',
      message: 'Credenciais inválidas.',
    });

    expect(usuario.save).not.toHaveBeenCalled();
    expect(servicoSessao.criarSessaoAtiva).not.toHaveBeenCalled();
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: usuario.id }),
      expect.objectContaining({ resultado: 'FALHA' }),
    );
  });

  it('informa o bloqueio quando a senha está correta', async () => {
    const bloqueadoAte = new Date(Date.now() + 10 * 60_000);
    const usuario = criarUsuario({ bloqueadoAte });
    repositorioUsuario.buscarPorEmail.mockResolvedValue(usuario);
    senha.verificarSenha.mockResolvedValue(true);

    const erro = await login(
      'usuario@example.com',
      'senha-correta',
      contexto,
    ).catch((falha: unknown) => falha);

    expect(erro).toBeInstanceOf(AccountLockedError);
    expect(erro).toMatchObject({
      statusCode: 423,
      codigo: 'CONTA_BLOQUEADA',
      message: expect.stringContaining('temporariamente bloqueada'),
    });
    expect(usuario.save).not.toHaveBeenCalled();
    expect(servicoSessao.criarSessaoAtiva).not.toHaveBeenCalled();
    expect(auditoria.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: usuario.id }),
      expect.objectContaining({
        resultado: 'FALHA',
        metadados: { motivo: 'CONTA_BLOQUEADA' },
      }),
    );
  });

  it('avisa antes da última tentativa, sem confirmar a existência da conta', async () => {
    const usuario = criarUsuario();
    repositorioUsuario.buscarPorEmail.mockResolvedValue(usuario);
    senha.verificarSenha.mockResolvedValue(false);

    await expect(
      login('usuario@example.com', 'senha-errada', {
        ...contexto,
        tentativasLoginIp: env.login.maxAttempts - 2,
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining('mais uma tentativa'),
    });
  });

  it('exibe o mesmo aviso para e-mail inexistente', async () => {
    repositorioUsuario.buscarPorEmail.mockResolvedValue(null);

    await expect(
      login('nao-existe@example.com', 'senha-errada', {
        ...contexto,
        tentativasLoginIp: env.login.maxAttempts - 2,
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining('mais uma tentativa'),
    });
  });

  it('avisa sobre bloqueio após a tentativa que atinge o limite', async () => {
    const usuario = criarUsuario({
      tentativasFalhas: env.login.maxAttempts - 1,
    });
    repositorioUsuario.buscarPorEmail.mockResolvedValue(usuario);
    senha.verificarSenha.mockResolvedValue(false);

    await expect(
      login('usuario@example.com', 'senha-errada', {
        ...contexto,
        tentativasLoginIp: env.login.maxAttempts - 1,
      }),
    ).rejects.toMatchObject({
      message: expect.stringContaining('poderá ter sido bloqueada'),
    });
  });

  it('bloqueia a conta ao atingir o limite de tentativas', async () => {
    const usuario = criarUsuario({
      tentativasFalhas: env.login.maxAttempts - 1,
    });
    repositorioUsuario.buscarPorEmail.mockResolvedValue(usuario);
    senha.verificarSenha.mockResolvedValue(false);

    await expect(
      login('usuario@example.com', 'senha-errada', contexto),
    ).rejects.toMatchObject({ codigo: 'NAO_AUTENTICADO' });

    expect(usuario.tentativasFalhas).toBe(0);
    expect(usuario.bloqueadoAte).toBeInstanceOf(Date);
    expect(usuario.save).toHaveBeenCalledTimes(1);
  });

  it('permite login quando o bloqueio expirou', async () => {
    const usuario = criarUsuario({
      bloqueadoAte: new Date(Date.now() - 1_000),
      tentativasFalhas: 3,
    });
    repositorioUsuario.buscarPorEmail.mockResolvedValue(usuario);
    repositorioUsuario.buscarParaAutenticacao.mockResolvedValue({
      usuario,
      permissoes: new Set<string>(),
      roles: [],
    });
    senha.verificarSenha.mockResolvedValue(true);

    await expect(
      login('usuario@example.com', 'senha-correta', contexto),
    ).resolves.toMatchObject({ tipo: 'LOGIN' });

    expect(usuario.bloqueadoAte).toBeNull();
    expect(usuario.tentativasFalhas).toBe(0);
    expect(usuario.save).toHaveBeenCalledTimes(1);
  });
});
