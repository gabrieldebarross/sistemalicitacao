import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AuthenticationError,
  MfaChallengeError,
} from '../../src/errors/app-error.js';

const repositorioSessao = {
  buscarPorId: vi.fn(),
  incrementarTentativasMfa: vi.fn(),
};

const repositorioUsuario = {
  buscarParaAutenticacao: vi.fn(),
};

const mfaService = {
  verificarCodigo: vi.fn(),
};

const sessaoService = {
  revogarSessao: vi.fn(),
  ativarSessaoMfa: vi.fn(),
};

vi.mock('../../src/repositories/sessao.repository.js', () => repositorioSessao);
vi.mock('../../src/repositories/usuario.repository.js', () => repositorioUsuario);
vi.mock('../../src/services/mfa.service.js', () => mfaService);
vi.mock('../../src/services/sessao.service.js', () => sessaoService);
vi.mock('../../src/services/auditoria.service.js', () => ({
  registrar: vi.fn().mockResolvedValue(undefined),
}));

const { verificarDesafioMfa } = await import('../../src/services/auth.service.js');

function desafio(tentativas: number) {
  return {
    id: 'sessao-1',
    usuarioId: 10,
    estado: 'MFA_PENDENTE',
    revogadaEm: null,
    expiraEm: new Date(Date.now() + 60_000),
    mfaConfiguracaoPendente: false,
    mfaTentativas: tentativas,
  };
}

const contexto = {
  requestId: 'req-mfa',
  ip: '127.0.0.1',
  userAgent: 'vitest',
};

describe('limite de tentativas do desafio de MFA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repositorioUsuario.buscarParaAutenticacao.mockResolvedValue({
      usuario: { id: 10, ativo: true, mfaAtivo: true },
      permissoes: new Set<string>(),
      roles: [],
    });
    repositorioSessao.buscarPorId.mockResolvedValue(desafio(4));
    mfaService.verificarCodigo.mockResolvedValue(null);
    repositorioSessao.incrementarTentativasMfa.mockResolvedValue(5);
    sessaoService.revogarSessao.mockResolvedValue(undefined);
  });

  it('encerra o desafio ao atingir a quinta tentativa inválida', async () => {
    await expect(
      verificarDesafioMfa('sessao-1', 10, '000000', contexto),
    ).rejects.toMatchObject({
      codigo: 'MFA_DESAFIO_ENCERRADO',
    });
    expect(repositorioSessao.incrementarTentativasMfa).toHaveBeenCalledWith(
      'sessao-1',
    );
    expect(sessaoService.revogarSessao).toHaveBeenCalledWith('sessao-1');
  });

  it('mantém o desafio quando ainda há tentativas disponíveis', async () => {
    repositorioSessao.incrementarTentativasMfa.mockResolvedValue(1);

    const erro = await verificarDesafioMfa(
      'sessao-1',
      10,
      '000000',
      contexto,
    ).catch((falha: unknown) => falha);

    expect(erro).toBeInstanceOf(AuthenticationError);
    expect(erro).not.toBeInstanceOf(MfaChallengeError);
    expect(sessaoService.revogarSessao).not.toHaveBeenCalled();
  });

  it('informa quando o código de recuperação já foi utilizado', async () => {
    repositorioSessao.buscarPorId.mockResolvedValue(desafio(0));
    repositorioSessao.incrementarTentativasMfa.mockResolvedValue(1);
    mfaService.verificarCodigo.mockResolvedValue('RECUPERACAO_JA_USADA');

    await expect(
      verificarDesafioMfa('sessao-1', 10, 'BC149-3084F', contexto),
    ).rejects.toMatchObject({
      message: expect.stringContaining('já foi utilizado'),
    });
    expect(repositorioSessao.incrementarTentativasMfa).toHaveBeenCalledWith(
      'sessao-1',
    );
    expect(sessaoService.revogarSessao).not.toHaveBeenCalled();
  });

  it('recusa desafio expirado com código próprio de encerramento', async () => {
    repositorioSessao.buscarPorId.mockResolvedValue({
      ...desafio(0),
      expiraEm: new Date(Date.now() - 1_000),
    });

    await expect(
      verificarDesafioMfa('sessao-1', 10, '000000', contexto),
    ).rejects.toMatchObject({
      codigo: 'MFA_DESAFIO_ENCERRADO',
    });
  });
});
