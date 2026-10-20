import { Op, type Transaction } from 'sequelize';

import { Setor } from '../models/setor.js';

export interface CriarSetor {
  nome: string;
  sigla: string | null;
  ativo?: boolean;
}

export interface FiltroSetor {
  busca?: string;
  ativo?: boolean;
}

export async function criar(
  dados: CriarSetor,
  transaction?: Transaction,
): Promise<Setor> {
  return Setor.create(dados, transaction ? { transaction } : {});
}

export async function buscarPorId(id: number): Promise<Setor | null> {
  return Setor.findByPk(id);
}

export async function buscarPorNome(nome: string): Promise<Setor | null> {
  return Setor.findOne({ where: { nome } });
}

export async function listar(
  filtro: FiltroSetor,
  offset: number,
  limit: number,
): Promise<{ itens: Setor[]; total: number }> {
  const where: Record<string, unknown> = {};
  if (filtro.busca) {
    where.nome = { [Op.like]: `%${filtro.busca}%` };
  }
  if (filtro.ativo !== undefined) {
    where.ativo = filtro.ativo;
  }
  const { rows, count } = await Setor.findAndCountAll({
    where,
    order: [['nome', 'ASC']],
    offset,
    limit,
  });
  return { itens: rows, total: count };
}

export async function atualizar(
  setor: Setor,
  dados: Partial<CriarSetor>,
): Promise<Setor> {
  return setor.update(dados);
}
