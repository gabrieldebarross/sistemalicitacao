import type { Transaction, WhereOptions } from 'sequelize';

import type { MovimentacaoTipo } from '../domain/enums.js';
import { Movimentacao } from '../models/movimentacao.js';
import { Setor } from '../models/setor.js';
import { Usuario } from '../models/usuario.js';

export interface CriarMovimentacao {
  processoId: number;
  processoEtapaId: number | null;
  usuarioId: number | null;
  setorId: number | null;
  tipo: MovimentacaoTipo;
  descricao: string | null;
  metadados: Record<string, unknown> | null;
  correlacaoId: string | null;
}

export async function criar(
  dados: CriarMovimentacao,
  transaction?: Transaction,
): Promise<Movimentacao> {
  return Movimentacao.create(dados, transaction ? { transaction } : {});
}

export interface FiltroMovimentacao {
  processoId: number;
  tipo?: MovimentacaoTipo;
  offset: number;
  limit: number;
}

export async function listarPorProcesso(
  filtro: FiltroMovimentacao,
): Promise<{ itens: Movimentacao[]; total: number }> {
  const where: WhereOptions = { processoId: filtro.processoId };
  if (filtro.tipo) {
    where.tipo = filtro.tipo;
  }

  const { rows, count } = await Movimentacao.findAndCountAll({
    where,
    include: [
      { model: Usuario, as: 'usuario', attributes: ['id', 'nome'] },
      { model: Setor, as: 'setor', attributes: ['id', 'nome'] },
    ],
    order: [
      ['created_at', 'DESC'],
      ['id', 'DESC'],
    ],
    offset: filtro.offset,
    limit: filtro.limit,
  });

  return { itens: rows, total: count };
}
