import { Op, type Transaction, type WhereOptions } from 'sequelize';

import { Cargo } from '../models/cargo.js';

export interface CriarCargo {
  nome: string;
  nomeOriginal: string | null;
}

export interface FiltroCargo {
  busca?: string;
}

export async function criar(
  dados: CriarCargo,
  transaction?: Transaction,
): Promise<Cargo> {
  return Cargo.create(dados, transaction ? { transaction } : {});
}

export async function buscarPorId(id: number): Promise<Cargo | null> {
  return Cargo.findByPk(id);
}

export async function buscarPorNome(nome: string): Promise<Cargo | null> {
  return Cargo.findOne({ where: { nome } });
}

export async function listar(
  filtro: FiltroCargo,
  offset: number,
  limit: number,
): Promise<{ itens: Cargo[]; total: number }> {
  const where: WhereOptions = filtro.busca
    ? { nome: { [Op.like]: `%${filtro.busca}%` } }
    : {};
  const { rows, count } = await Cargo.findAndCountAll({
    where,
    order: [['nome', 'ASC']],
    offset,
    limit,
  });
  return { itens: rows, total: count };
}

export async function atualizar(
  cargo: Cargo,
  dados: Partial<CriarCargo>,
): Promise<Cargo> {
  return cargo.update(dados);
}
