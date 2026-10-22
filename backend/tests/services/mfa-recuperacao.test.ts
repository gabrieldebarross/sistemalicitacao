import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Usuario } from '../../src/models/usuario.js';
import { hashToken } from '../../src/utils/security.js';

const repositorioCodigo = {
  buscarPorHash: vi.fn(),
  marcarUsado: vi.fn(),
};

vi.mock('../../src/repositories/mfa-codigo.repository.js', () => repositorioCodigo);

const { verificarCodigo } = await import('../../src/services/mfa.service.js');

const usuario = {
  id: 10,
  mfaAtivo: false,
  mfaSegredoCriptografado: null,
} as Usuario;

describe('código de recuperação', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aceita o código com hífen e em minúsculas', async () => {
    repositorioCodigo.buscarPorHash.mockResolvedValue({
      id: 1,
      usadoEm: null,
    });
    repositorioCodigo.marcarUsado.mockResolvedValue(1);

    await expect(verificarCodigo(usuario, 'bc149-3084f')).resolves.toBe(
      'RECUPERACAO',
    );
    expect(repositorioCodigo.buscarPorHash).toHaveBeenCalledWith(
      10,
      hashToken('BC1493084F'),
    );
    expect(repositorioCodigo.marcarUsado).toHaveBeenCalledWith(1);
  });

  it('não aceita código de recuperação já utilizado', async () => {
    repositorioCodigo.buscarPorHash.mockResolvedValue({
      id: 2,
      usadoEm: new Date(),
    });

    await expect(verificarCodigo(usuario, 'BC149-3084F')).resolves.toBe(
      'RECUPERACAO_JA_USADA',
    );
    expect(repositorioCodigo.marcarUsado).not.toHaveBeenCalled();
  });

  it('trata consumo concorrente como código já utilizado', async () => {
    repositorioCodigo.buscarPorHash.mockResolvedValue({
      id: 3,
      usadoEm: null,
    });
    repositorioCodigo.marcarUsado.mockResolvedValue(0);

    await expect(verificarCodigo(usuario, 'BC149-3084F')).resolves.toBe(
      'RECUPERACAO_JA_USADA',
    );
  });

  it('trata código desconhecido como inválido', async () => {
    repositorioCodigo.buscarPorHash.mockResolvedValue(null);

    await expect(verificarCodigo(usuario, 'AAAAA-AAAAA')).resolves.toBeNull();
    expect(repositorioCodigo.marcarUsado).not.toHaveBeenCalled();
  });
});
