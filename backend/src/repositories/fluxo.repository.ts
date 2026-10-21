import { Op, type Transaction, type WhereOptions } from 'sequelize';

import { sequelize } from '../config/database.js';
import { Etapa } from '../models/etapa.js';
import { Fase } from '../models/fase.js';
import { Fluxo } from '../models/fluxo.js';
import { TipoProcesso } from '../models/tipo-processo.js';

export interface CriarFluxo {
  tipoProcessoId: number;
  nome: string;
  descricao: string | null;
  versao?: number;
}

export interface CriarFase {
  fluxoId: number;
  nome: string;
  ordem: number;
  descricao: string | null;
}

export interface CriarEtapa {
  faseId: number;
  nome: string;
  ordem: number;
  obrigatoria?: boolean;
  prazoGestaoDias: number | null;
  responsavelSetorId: number | null;
  responsavelCargoId: number | null;
  responsavelUsuarioId: number | null;
  descricao: string | null;
  requisitos: string | null;
  referenciaLegal: string | null;
  condicional?: boolean;
  condicaoAplicabilidade: string | null;
  permitePulo?: boolean;
}

export interface FiltroFluxo {
  tipoProcessoId?: number;
  situacao?: string;
}

export async function criar(
  dados: CriarFluxo,
  transaction?: Transaction,
): Promise<Fluxo> {
  return Fluxo.create(dados, transaction ? { transaction } : {});
}

export async function buscarPorId(id: number): Promise<Fluxo | null> {
  return Fluxo.findByPk(id, {
    include: [
      { model: TipoProcesso, as: 'tipoProcesso' },
      {
        model: Fase,
        as: 'fases',
        include: [{ model: Etapa, as: 'etapas' }],
      },
    ],
    order: [
      [{ model: Fase, as: 'fases' }, 'ordem', 'ASC'],
      [
        { model: Fase, as: 'fases' },
        { model: Etapa, as: 'etapas' },
        'ordem',
        'ASC',
      ],
    ],
  });
}

export async function buscarPublicado(
  tipoProcessoId: number,
): Promise<Fluxo | null> {
  return Fluxo.findOne({
    where: { tipoProcessoId, situacao: 'PUBLICADO' },
    order: [['versao', 'DESC']],
  });
}

/** Fluxos publicados com fases/etapas, usados na criação de processo. */
export async function listarPublicadosComEtapas(
  tipoProcessoId: number,
): Promise<Fluxo[]> {
  return Fluxo.findAll({
    where: { tipoProcessoId, situacao: 'PUBLICADO' },
    include: [
      {
        model: Fase,
        as: 'fases',
        include: [{ model: Etapa, as: 'etapas' }],
      },
    ],
    order: [
      ['versao', 'DESC'],
      [{ model: Fase, as: 'fases' }, 'ordem', 'ASC'],
      [
        { model: Fase, as: 'fases' },
        { model: Etapa, as: 'etapas' },
        'ordem',
        'ASC',
      ],
    ],
  });
}

export async function ultimaVersao(
  tipoProcessoId: number,
  nome: string,
): Promise<number> {
  const fluxo = await Fluxo.findOne({
    where: { tipoProcessoId, nome },
    order: [['versao', 'DESC']],
  });
  return fluxo ? fluxo.versao : 0;
}

export async function listar(
  filtro: FiltroFluxo,
  offset: number,
  limit: number,
): Promise<{ itens: Fluxo[]; total: number }> {
  const where: WhereOptions = {};
  if (filtro.tipoProcessoId !== undefined) {
    where.tipoProcessoId = filtro.tipoProcessoId;
  }
  if (filtro.situacao !== undefined) {
    where.situacao = filtro.situacao;
  }
  const { rows, count } = await Fluxo.findAndCountAll({
    where,
    include: [{ model: TipoProcesso, as: 'tipoProcesso' }],
    order: [
      ['tipo_processo_id', 'ASC'],
      ['nome', 'ASC'],
      ['versao', 'DESC'],
    ],
    offset,
    limit,
    distinct: true,
  });
  return { itens: rows, total: count };
}

export async function atualizar(
  fluxo: Fluxo,
  dados: Partial<CriarFluxo>,
): Promise<Fluxo> {
  return fluxo.update(dados);
}

export async function publicar(
  fluxo: Fluxo,
  usuarioId: number,
): Promise<Fluxo> {
  return fluxo.update({
    situacao: 'PUBLICADO',
    publicadoEm: new Date(),
    publicadoPorId: usuarioId,
  });
}

/** Arquiva as demais versões publicadas do mesmo tipo de processo. */
export async function arquivarPublicadosDoTipo(
  tipoProcessoId: number,
  excetoId: number,
  transaction: Transaction,
): Promise<void> {
  await Fluxo.update(
    { situacao: 'ARQUIVADO' },
    {
      where: {
        tipoProcessoId,
        situacao: 'PUBLICADO',
        id: { [Op.ne]: excetoId },
      },
      transaction,
    },
  );
}

export async function arquivar(fluxo: Fluxo): Promise<Fluxo> {
  return fluxo.update({ situacao: 'ARQUIVADO' });
}

/** Cria fases */
export async function criarFase(
  dados: CriarFase,
  transaction?: Transaction,
): Promise<Fase> {
  return Fase.create(dados, transaction ? { transaction } : {});
}

export async function buscarFasePorId(id: number): Promise<Fase | null> {
  return Fase.findByPk(id, {
    include: [
      { model: Fluxo, as: 'fluxo' },
      { model: Etapa, as: 'etapas' },
    ],
  });
}

export async function atualizarFase(
  fase: Fase,
  dados: Partial<Omit<CriarFase, 'fluxoId'>>,
): Promise<Fase> {
  return fase.update(dados);
}

export async function removerFase(fase: Fase): Promise<void> {
  await sequelize.transaction(async (transaction) => {
    await Etapa.destroy({ where: { faseId: fase.id }, transaction });
    await fase.destroy({ transaction });
  });
}

export async function proximaOrdemFase(fluxoId: number): Promise<number> {
  const max = (await Fase.max<number | null, Fase>('ordem', {
    where: { fluxoId },
  })) as number | null;
  return (max ?? 0) + 1;
}

export async function criarEtapa(
  dados: CriarEtapa,
  transaction?: Transaction,
): Promise<Etapa> {
  return Etapa.create(dados, transaction ? { transaction } : {});
}

export async function buscarEtapaPorId(id: number): Promise<Etapa | null> {
  return Etapa.findByPk(id, {
    include: [
      {
        model: Fase,
        as: 'fase',
        include: [{ model: Fluxo, as: 'fluxo' }],
      },
    ],
  });
}

export async function atualizarEtapa(
  etapa: Etapa,
  dados: Partial<Omit<CriarEtapa, 'faseId'>>,
): Promise<Etapa> {
  return etapa.update(dados);
}

export async function removerEtapa(etapa: Etapa): Promise<void> {
  await etapa.destroy();
}

export async function proximaOrdemEtapa(faseId: number): Promise<number> {
  const max = (await Etapa.max<number | null, Etapa>('ordem', {
    where: { faseId },
  })) as number | null;
  return (max ?? 0) + 1;
}

export async function listarEtapasDoFluxo(fluxoId: number): Promise<Etapa[]> {
  const fases = await Fase.findAll({
    where: { fluxoId },
    include: [{ model: Etapa, as: 'etapas' }],
    order: [['ordem', 'ASC']],
  });
  return fases.flatMap((fase) => fase.etapas ?? []);
}

/** Clona um fluxo (fases e etapas) como nova versão em rascunho. */
export async function clonar(
  origem: Fluxo,
  novoNome: string,
  novaVersao: number,
): Promise<Fluxo> {
  return sequelize.transaction(async (transaction) => {
    const fasesOrigem = await Fase.findAll({
      where: { fluxoId: origem.id },
      include: [{ model: Etapa, as: 'etapas' }],
      order: [['ordem', 'ASC']],
    });

    const novo = await Fluxo.create(
      {
        tipoProcessoId: origem.tipoProcessoId,
        nome: novoNome,
        descricao: origem.descricao,
        versao: novaVersao,
      },
      { transaction },
    );

    for (const fase of fasesOrigem) {
      const novaFase = await Fase.create(
        {
          fluxoId: novo.id,
          nome: fase.nome,
          ordem: fase.ordem,
          descricao: fase.descricao,
        },
        { transaction },
      );
      for (const etapa of fase.etapas ?? []) {
        await Etapa.create(
          {
            faseId: novaFase.id,
            nome: etapa.nome,
            ordem: etapa.ordem,
            obrigatoria: etapa.obrigatoria,
            prazoGestaoDias: etapa.prazoGestaoDias,
            responsavelSetorId: etapa.responsavelSetorId,
            responsavelCargoId: etapa.responsavelCargoId,
            responsavelUsuarioId: etapa.responsavelUsuarioId,
            descricao: etapa.descricao,
            requisitos: etapa.requisitos,
            referenciaLegal: etapa.referenciaLegal,
            condicional: etapa.condicional,
            condicaoAplicabilidade: etapa.condicaoAplicabilidade,
            permitePulo: etapa.permitePulo,
          },
          { transaction },
        );
      }
    }
    return novo;
  });
}
