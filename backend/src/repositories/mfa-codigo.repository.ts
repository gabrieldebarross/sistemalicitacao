import { Op, type Transaction } from 'sequelize';

import { MfaCodigoRecuperacao } from '../models/mfa-codigo-recuperacao.js';

export async function criarVarios(
  usuarioId: number,
  codigosHash: readonly string[],
  transaction?: Transaction,
): Promise<void> {
  await MfaCodigoRecuperacao.bulkCreate(
    codigosHash.map((codigoHash) => ({ usuarioId, codigoHash })),
    transaction ? { transaction } : {},
  );
}

export async function buscarNaoUsadoPorHash(
  usuarioId: number,
  codigoHash: string,
): Promise<MfaCodigoRecuperacao | null> {
  return MfaCodigoRecuperacao.findOne({
    where: { usuarioId, codigoHash, usadoEm: null },
  });
}

export async function marcarUsado(
  id: number,
  transaction?: Transaction,
): Promise<number> {
  const [afetadas] = await MfaCodigoRecuperacao.update(
    { usadoEm: new Date() },
    {
      where: { id, usadoEm: null },
      ...(transaction ? { transaction } : {}),
    },
  );
  return afetadas;
}

export async function destruirDoUsuario(
  usuarioId: number,
  transaction?: Transaction,
): Promise<void> {
  await MfaCodigoRecuperacao.destroy({
    where: { usuarioId },
    transaction,
  });
}

export async function contarDisponiveis(usuarioId: number): Promise<number> {
  return MfaCodigoRecuperacao.count({
    where: { usuarioId, usadoEm: { [Op.eq]: null } },
  });
}
