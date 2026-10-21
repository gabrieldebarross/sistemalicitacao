import { Op, type Transaction, type WhereOptions } from 'sequelize';

import { Delegacao } from '../models/delegacao.js';
import { Processo } from '../models/processo.js';
import { Usuario } from '../models/usuario.js';

export interface CriarDelegacao {
  origemUsuarioId: number;
  destinoUsuarioId: number;
  processoId: number | null;
  inicioEm: Date;
  fimEm: Date;
  motivo: string;
  criadoPorId: number;
}

const INCLUDE_PARTES = [
  { model: Usuario, as: 'origem' },
  { model: Usuario, as: 'destino' },
  { model: Processo, as: 'processo' },
];

export async function criar(dados: CriarDelegacao): Promise<Delegacao> {
  return Delegacao.create(dados);
}

export async function buscarPorId(id: number): Promise<Delegacao | null> {
  return Delegacao.findByPk(id, { include: INCLUDE_PARTES });
}

export async function listarDoUsuario(
  usuarioId: number,
  incluirHistorico: boolean,
  offset: number,
  limit: number,
): Promise<{ itens: Delegacao[]; total: number }> {
  const where: Record<string | symbol, unknown> = {
    [Op.or]: [{ origemUsuarioId: usuarioId }, { destinoUsuarioId: usuarioId }],
  };
  if (!incluirHistorico) {
    where.canceladoEm = null;
    where.fimEm = { [Op.gt]: new Date() };
  }
  const { rows, count } = await Delegacao.findAndCountAll({
    where: where as WhereOptions,
    include: INCLUDE_PARTES,
    order: [['inicio_em', 'DESC']],
    offset,
    limit,
    distinct: true,
  });
  return { itens: rows, total: count };
}

export async function listarAtivasParaDestino(
  destinoUsuarioId: number,
  agora: Date,
): Promise<Delegacao[]> {
  return Delegacao.findAll({
    where: {
      destinoUsuarioId,
      canceladoEm: null,
      inicioEm: { [Op.lte]: agora },
      fimEm: { [Op.gte]: agora },
    },
    order: [['inicio_em', 'DESC']],
  });
}

export async function listarAtivasEnvolvendoUsuario(
  usuarioId: number,
  agora: Date,
): Promise<Delegacao[]> {
  return Delegacao.findAll({
    where: {
      canceladoEm: null,
      inicioEm: { [Op.lte]: agora },
      fimEm: { [Op.gte]: agora },
      [Op.or]: [
        { origemUsuarioId: usuarioId },
        { destinoUsuarioId: usuarioId },
      ],
    },
  });
}

export async function existeSobreposicao(
  origemUsuarioId: number,
  destinoUsuarioId: number,
  processoId: number | null,
  inicioEm: Date,
  fimEm: Date,
): Promise<boolean> {
  const quantidade = await Delegacao.count({
    where: {
      origemUsuarioId,
      destinoUsuarioId,
      processoId: processoId === null ? null : processoId,
      canceladoEm: null,
      inicioEm: { [Op.lt]: fimEm },
      fimEm: { [Op.gt]: inicioEm },
    },
  });
  return quantidade > 0;
}

export async function cancelar(
  delegacao: Delegacao,
  canceladoPorId: number,
): Promise<Delegacao> {
  return delegacao.update({
    canceladoEm: new Date(),
    canceladoPorId,
  });
}

export async function cancelarDoUsuario(
  usuarioId: number,
  canceladoPorId: number | null,
  transaction?: Transaction,
): Promise<number> {
  const [afetadas] = await Delegacao.update(
    { canceladoEm: new Date(), canceladoPorId },
    {
      where: {
        canceladoEm: null,
        [Op.or]: [
          { origemUsuarioId: usuarioId },
          { destinoUsuarioId: usuarioId },
        ],
      },
      ...(transaction ? { transaction } : {}),
    },
  );
  return afetadas;
}
