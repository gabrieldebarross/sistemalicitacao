import type { Transaction } from 'sequelize';

import { Movimentacao } from '../models/movimentacao.js';
import { Setor } from '../models/setor.js';
import { Usuario } from '../models/usuario.js';
import type { MovimentacaoTipo } from '../domain/enums.js';

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

export async function listarPorProcesso(
  processoId: number,
): Promise<Movimentacao[]> {
  return Movimentacao.findAll({
    where: { processoId },
    include: [
      { model: Usuario, as: 'usuario', attributes: ['id', 'nome'] },
      { model: Setor, as: 'setor', attributes: ['id', 'nome'] },
    ],
    order: [['created_at', 'DESC']],
  });
}
