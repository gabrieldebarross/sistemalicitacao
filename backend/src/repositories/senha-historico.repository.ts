import { Op, type Transaction } from 'sequelize';

import { env } from '../config/env.js';
import { SenhaHistorico } from '../models/senha-historico.js';

export async function criar(
  usuarioId: number,
  senhaHash: string,
  transaction?: Transaction,
): Promise<SenhaHistorico> {
  return SenhaHistorico.create(
    { usuarioId, senhaHash },
    transaction ? { transaction } : {},
  );
}

export async function listarRecentes(
  usuarioId: number,
  limite: number,
): Promise<SenhaHistorico[]> {
  return SenhaHistorico.findAll({
    where: { usuarioId },
    order: [['created_at', 'DESC']],
    limit: limite,
  });
}

/** Mantém apenas os hashes mais recentes configurados. */
export async function podar(
  usuarioId: number,
  transaction?: Transaction,
): Promise<void> {
  const manter = await SenhaHistorico.findAll({
    where: { usuarioId },
    attributes: ['id'],
    order: [['created_at', 'DESC']],
    limit: env.password.historySize,
    transaction,
  });
  const ids = manter.map((item) => item.id);
  if (ids.length === 0) {
    return;
  }
  await SenhaHistorico.destroy({
    where: {
      usuarioId,
      id: { [Op.notIn]: ids },
    },
    transaction,
  });
}
