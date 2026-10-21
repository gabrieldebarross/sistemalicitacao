import { Op, type Transaction, type WhereOptions } from 'sequelize';

import { Sessao, type SessaoEstado } from '../models/sessao.js';

export interface CriarSessao {
  id: string;
  usuarioId: number;
  refreshTokenHash: string | null;
  estado: SessaoEstado;
  mfaConfiguracaoPendente?: boolean;
  expiraEm: Date;
  ip: string | null;
  userAgent: string | null;
}

export async function criar(
  dados: CriarSessao,
  transaction?: Transaction,
): Promise<Sessao> {
  return Sessao.create(dados, transaction ? { transaction } : {});
}

export async function buscarPorId(id: string): Promise<Sessao | null> {
  return Sessao.findByPk(id);
}

export async function buscarPorIdComLock(
  id: string,
  transaction: Transaction,
): Promise<Sessao | null> {
  return Sessao.findByPk(id, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}

export async function atualizar(
  sessao: Sessao,
  dados: Partial<
    Pick<
      Sessao,
      | 'refreshTokenHash'
      | 'refreshTokenAnteriorHash'
      | 'refreshRotacionadoEm'
      | 'estado'
      | 'mfaConfiguracaoPendente'
      | 'mfaTentativas'
      | 'expiraEm'
      | 'revogadaEm'
      | 'ultimoUsoEm'
    >
  >,
  transaction?: Transaction,
): Promise<Sessao> {
  return sessao.update(dados, transaction ? { transaction } : {});
}

export async function revogar(
  id: string,
  quando: Date,
  transaction?: Transaction,
): Promise<number> {
  const [afetadas] = await Sessao.update(
    { revogadaEm: quando },
    {
      where: { id, revogadaEm: null },
      ...(transaction ? { transaction } : {}),
    },
  );
  return afetadas;
}

export async function revogarTodasDoUsuario(
  usuarioId: number,
  quando: Date,
  excetoId?: string,
  transaction?: Transaction,
): Promise<number> {
  const where: WhereOptions = { usuarioId, revogadaEm: null };
  if (excetoId) {
    where.id = { [Op.ne]: excetoId };
  }
  const [afetadas] = await Sessao.update(
    { revogadaEm: quando },
    { where, ...(transaction ? { transaction } : {}) },
  );
  return afetadas;
}

export async function listarAtivasPorUsuario(
  usuarioId: number,
  agora: Date,
): Promise<Sessao[]> {
  return Sessao.findAll({
    where: {
      usuarioId,
      estado: 'ATIVA',
      revogadaEm: null,
      expiraEm: { [Op.gt]: agora },
    },
    order: [['created_at', 'DESC']],
  });
}

export async function listarPorUsuario(usuarioId: number): Promise<Sessao[]> {
  return Sessao.findAll({
    where: { usuarioId },
    order: [['created_at', 'DESC']],
    limit: 100,
  });
}

export async function buscarAtivaPorId(
  id: string,
  agora: Date,
): Promise<Sessao | null> {
  return Sessao.findOne({
    where: {
      id,
      estado: 'ATIVA',
      revogadaEm: null,
      expiraEm: { [Op.gt]: agora },
    },
  });
}
