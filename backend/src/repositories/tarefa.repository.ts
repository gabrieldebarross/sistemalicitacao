import { Op } from 'sequelize';

import { Processo } from '../models/processo.js';
import { ProcessoEtapa } from '../models/processo-etapa.js';
import { Setor } from '../models/setor.js';
import { Usuario } from '../models/usuario.js';

export interface TarefaRegistro {
  etapa: ProcessoEtapa;
  processo: Processo;
}

const STATUS_ETAPA_ATIVA = ['PENDENTE', 'EM_ANDAMENTO', 'BLOQUEADA'];
const STATUS_PROCESSO_ENCERRADO = ['CONCLUIDO', 'ANULADO', 'REVOGADO'];

export async function listarCandidatas(
  responsaveisIds: readonly number[],
): Promise<TarefaRegistro[]> {
  if (responsaveisIds.length === 0) {
    return [];
  }
  const etapas = await ProcessoEtapa.findAll({
    where: {
      responsavelId: { [Op.in]: [...responsaveisIds] },
      status: { [Op.in]: STATUS_ETAPA_ATIVA },
    },
    include: [
      { model: Usuario, as: 'responsavel' },
      { model: Setor, as: 'setor' },
      {
        model: Processo,
        as: 'processo',
        required: true,
        where: { status: { [Op.notIn]: STATUS_PROCESSO_ENCERRADO } },
        include: [
          { model: Usuario, as: 'responsavelAtual' },
          { model: Setor, as: 'setorAtual' },
        ],
      },
    ],
    order: [
      ['data_prevista', 'ASC'],
      ['id', 'ASC'],
    ],
  });
  return etapas
    .filter(
      (etapa): etapa is ProcessoEtapa & { processo: Processo } =>
        etapa.processo !== undefined,
    )
    .map((etapa) => ({ etapa, processo: etapa.processo }));
}
