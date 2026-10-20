import { Op, type Transaction } from 'sequelize';

import { TipoProcesso } from '../models/tipo-processo.js';

export interface CriarTipoProcesso {
  nome: string;
  descricao: string | null;
  baseLegal: string | null;
  ativo?: boolean;
}

export interface FiltroTipoProcesso {
  busca?: string;
  ativo?: boolean;
}

export async function criar(
  dados: CriarTipoProcesso,
  transaction?: Transaction,
): Promise<TipoProcesso> {
  return TipoProcesso.create(dados, transaction ? { transaction } : {});
}

export async function buscarPorId(id: number): Promise<TipoProcesso | null> {
  return TipoProcesso.findByPk(id);
}

export async function buscarPorNome(nome: string): Promise<TipoProcesso | null> {
  return TipoProcesso.findOne({ where: { nome } });
}

export async function listar(
  filtro: FiltroTipoProcesso,
  offset: number,
  limit: number,
): Promise<{ itens: TipoProcesso[]; total: number }> {
  const where: Record<string, unknown> = {};
  if (filtro.busca) {
    where.nome = { [Op.like]: `%${filtro.busca}%` };
  }
  if (filtro.ativo !== undefined) {
    where.ativo = filtro.ativo;
  }
  const { rows, count } = await TipoProcesso.findAndCountAll({
    where,
    order: [['nome', 'ASC']],
    offset,
    limit,
  });
  return { itens: rows, total: count };
}

export async function atualizar(
  tipo: TipoProcesso,
  dados: Partial<CriarTipoProcesso>,
): Promise<TipoProcesso> {
  return tipo.update(dados);
}
