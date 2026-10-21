import { Op, QueryTypes, type Transaction, type WhereOptions } from 'sequelize';

import { sequelize } from '../config/database.js';
import type { ProcessoEtapaStatus, ProcessoStatus } from '../domain/enums.js';
import { Etapa } from '../models/etapa.js';
import { Fluxo } from '../models/fluxo.js';
import { Processo } from '../models/processo.js';
import { ProcessoEtapa } from '../models/processo-etapa.js';
import { Setor } from '../models/setor.js';
import { TipoProcesso } from '../models/tipo-processo.js';
import { Usuario } from '../models/usuario.js';

export interface CriarProcesso {
  numero: string;
  nome: string;
  objeto: string;
  descricao: string | null;
  tipoProcessoId: number;
  fluxoId: number;
  criadoPorId: number | null;
}

export interface CriarProcessoEtapa {
  processoId: number;
  etapaId: number | null;
  sequencia: number;
  nome: string;
  faseNome: string | null;
  obrigatoria: boolean;
  prazoGestaoDias: number | null;
  responsavelId: number | null;
  setorId: number | null;
  status?: ProcessoEtapaStatus;
  condicional?: boolean;
  condicaoAplicabilidade?: string | null;
  permitePulo?: boolean;
  motivoPulo?: string | null;
  puladaEm?: Date | null;
}

export interface FiltroProcesso {
  status?: ProcessoStatus;
  tipoProcessoId?: number;
  setorAtualId?: number;
  responsavelAtualId?: number;
  etapaAtualId?: number;
  atrasado?: boolean;
  criadoDe?: Date;
  criadoAte?: Date;
  busca?: string;
  ordenarPor?: 'numero' | 'nome' | 'created_at' | 'data_prevista' | 'status';
  direcao?: 'asc' | 'desc';
}

const INCLUDE_DETALHE = [
  { model: TipoProcesso, as: 'tipoProcesso' },
  { model: Fluxo, as: 'fluxo' },
  { model: Setor, as: 'setorAtual' },
  { model: Usuario, as: 'responsavelAtual' },
  {
    model: ProcessoEtapa,
    as: 'etapas',
    include: [
      { model: Usuario, as: 'responsavel' },
      { model: Setor, as: 'setor' },
    ],
  },
];

export async function criar(
  dados: CriarProcesso,
  transaction: Transaction,
): Promise<Processo> {
  return Processo.create(dados, { transaction });
}

export async function buscarPorId(id: number): Promise<Processo | null> {
  return Processo.findByPk(id, {
    include: INCLUDE_DETALHE,
    order: [[{ model: ProcessoEtapa, as: 'etapas' }, 'sequencia', 'ASC']],
  });
}

/**
 * Carrega o processo com bloqueio de escrita para operações de transição que
 * precisam validar e alterar processo + etapas na mesma transação.
 */
export async function buscarPorIdComLock(
  id: number,
  transaction: Transaction,
): Promise<Processo | null> {
  return Processo.findByPk(id, {
    include: INCLUDE_DETALHE,
    order: [[{ model: ProcessoEtapa, as: 'etapas' }, 'sequencia', 'ASC']],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
}

export async function buscarPorNumero(
  numero: string,
): Promise<Processo | null> {
  return Processo.findOne({ where: { numero } });
}

export async function listar(
  filtro: FiltroProcesso,
  offset: number,
  limit: number,
): Promise<{ itens: Processo[]; total: number }> {
  const where: WhereOptions = {};
  if (filtro.status !== undefined) {
    where.status = filtro.status;
  }
  if (filtro.tipoProcessoId !== undefined) {
    where.tipoProcessoId = filtro.tipoProcessoId;
  }
  if (filtro.setorAtualId !== undefined) {
    where.setorAtualId = filtro.setorAtualId;
  }
  if (filtro.responsavelAtualId !== undefined) {
    where.responsavelAtualId = filtro.responsavelAtualId;
  }
  if (filtro.etapaAtualId !== undefined) {
    where.processoEtapaAtualId = filtro.etapaAtualId;
  }
  if (filtro.criadoDe || filtro.criadoAte) {
    where.createdAt = {};
    if (filtro.criadoDe) {
      (where.createdAt as Record<symbol, Date>)[Op.gte] = filtro.criadoDe;
    }
    if (filtro.criadoAte) {
      (where.createdAt as Record<symbol, Date>)[Op.lte] = filtro.criadoAte;
    }
  }
  if (filtro.busca) {
    Object.assign(where, {
      [Op.or]: [
        { nome: { [Op.like]: `%${filtro.busca}%` } },
        { numero: { [Op.like]: `%${filtro.busca}%` } },
        { objeto: { [Op.like]: `%${filtro.busca}%` } },
      ],
    });
  }

  const etapaAtualInclude: Record<string, unknown> = {
    model: ProcessoEtapa,
    as: 'etapaAtual',
    attributes: ['id', 'nome', 'status', 'dataPrevista'],
    include: [
      { model: Usuario, as: 'responsavel' },
      { model: Setor, as: 'setor' },
    ],
  };
  if (filtro.atrasado === true) {
    etapaAtualInclude.required = true;
    etapaAtualInclude.where = {
      status: { [Op.in]: ['PENDENTE', 'EM_ANDAMENTO', 'BLOQUEADA'] },
      dataPrevista: { [Op.lt]: new Date() },
    };
  }

  const direcao = filtro.direcao ?? 'desc';
  const ordenarPor = filtro.ordenarPor ?? 'created_at';
  const order: unknown =
    ordenarPor === 'data_prevista'
      ? [
          [{ model: ProcessoEtapa, as: 'etapaAtual' }, 'data_prevista', direcao],
          ['id', direcao],
        ]
      : [
          [ordenarPor === 'created_at' ? 'createdAt' : ordenarPor, direcao],
          ['id', direcao],
        ];

  const { rows, count } = await Processo.findAndCountAll({
    where,
    include: [
      { model: TipoProcesso, as: 'tipoProcesso' },
      { model: Setor, as: 'setorAtual' },
      { model: Usuario, as: 'responsavelAtual' },
      etapaAtualInclude as never,
    ],
    order: order as never,
    offset,
    limit,
    distinct: true,
  });
  return { itens: rows, total: count };
}

/** Processos com atribuição ativa a um usuário, para transferência. */
export async function listarAtribuidosAoUsuario(
  usuarioId: number,
  transaction?: Transaction,
): Promise<Processo[]> {
  return Processo.findAll({
    where: {
      responsavelAtualId: usuarioId,
      status: { [Op.notIn]: ['CONCLUIDO', 'ANULADO', 'REVOGADO'] },
    },
    ...(transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {}),
    order: [['id', 'ASC']],
  });
}

export async function listarEtapasAtivasDoUsuario(
  usuarioId: number,
  transaction?: Transaction,
): Promise<ProcessoEtapa[]> {
  return ProcessoEtapa.findAll({
    where: {
      responsavelId: usuarioId,
      status: { [Op.in]: ['PENDENTE', 'EM_ANDAMENTO', 'BLOQUEADA'] },
    },
    include: [
      {
        model: Processo,
        as: 'processo',
        required: true,
        attributes: ['id', 'status'],
        where: { status: { [Op.notIn]: ['CONCLUIDO', 'ANULADO', 'REVOGADO'] } },
      },
    ],
    ...(transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {}),
    order: [['processo_id', 'ASC'], ['sequencia', 'ASC']],
  });
}

export async function atualizar(
  processo: Processo,
  dados: Partial<CriarProcesso> &
    Partial<{
      status: ProcessoStatus;
      setorAtualId: number | null;
      responsavelAtualId: number | null;
      iniciadoEm: Date | null;
      finalizadoEm: Date | null;
      processoEtapaAtualId: number | null;
    }>,
  transaction?: Transaction,
): Promise<Processo> {
  return processo.update(dados, transaction ? { transaction } : {});
}

export async function buscarEtapaPorId(
  id: number,
): Promise<ProcessoEtapa | null> {
  return ProcessoEtapa.findByPk(id);
}

export async function listarEtapas(processoId: number): Promise<ProcessoEtapa[]> {
  return ProcessoEtapa.findAll({
    where: { processoId },
    order: [['sequencia', 'ASC']],
  });
}

export async function atualizarEtapa(
  etapa: ProcessoEtapa,
  dados: Partial<
    Omit<CriarProcessoEtapa, 'processoId' | 'sequencia' | 'nome'>
  > & {
    status?: ProcessoEtapaStatus;
    dataInicio?: Date | null;
    dataPrevista?: Date | null;
    dataConclusao?: Date | null;
    motivoBloqueio?: string | null;
    motivoPulo?: string | null;
    puladaEm?: Date | null;
    retornoParaEtapaId?: number | null;
  },
  transaction?: Transaction,
): Promise<ProcessoEtapa> {
  return etapa.update(dados, transaction ? { transaction } : {});
}

export async function criarEtapasEmLote(
  etapas: CriarProcessoEtapa[],
  transaction: Transaction,
): Promise<ProcessoEtapa[]> {
  return ProcessoEtapa.bulkCreate(etapas, { transaction });
}

export async function buscarPrimeiraEtapa(
  processoId: number,
): Promise<ProcessoEtapa | null> {
  return ProcessoEtapa.findOne({
    where: { processoId },
    order: [['sequencia', 'ASC']],
  });
}

export async function buscarEtapaDefinicao(
  etapaId: number,
): Promise<Etapa | null> {
  return Etapa.findByPk(etapaId);
}

export interface EstatisticasProcessos {
  total: number;
  porStatus: Array<{ status: string; total: number }>;
  etapasAtrasadas: number;
}

export async function estatisticas(): Promise<EstatisticasProcessos> {
  const total = await Processo.count();
  const porStatus = await sequelize.query<{
    status: string;
    total: number | string;
  }>('SELECT status, COUNT(*) AS total FROM processos GROUP BY status', {
    type: QueryTypes.SELECT,
  });
  const etapasAtrasadas = await ProcessoEtapa.count({
    where: {
      status: 'EM_ANDAMENTO',
      dataPrevista: { [Op.lt]: new Date() },
    },
  });
  return {
    total,
    porStatus: porStatus.map((linha) => ({
      status: linha.status,
      total: Number(linha.total),
    })),
    etapasAtrasadas,
  };
}

export async function estatisticasPorTipo(): Promise<
  Array<{ tipo: string; total: number }>
> {
  const linhas = await sequelize.query<{ tipo: string; total: number | string }>(
    `SELECT tp.nome AS tipo, COUNT(p.id) AS total
       FROM tipos_processo tp
       LEFT JOIN processos p ON p.tipo_processo_id = tp.id
      GROUP BY tp.id, tp.nome
      ORDER BY tp.nome`,
    { type: QueryTypes.SELECT },
  );
  return linhas.map((linha) => ({
    tipo: linha.tipo,
    total: Number(linha.total),
  }));
}

/**
 * Conta processos que ainda dependem do fluxo (rascunho, em andamento ou
 * suspenso). Usado para impedir o arquivamento de fluxo em uso.
 */
export async function contarAtivosPorFluxo(fluxoId: number): Promise<number> {
  return Processo.count({
    where: {
      fluxoId,
      status: {
        [Op.in]: [
          'RASCUNHO',
          'EM_ANDAMENTO',
          'SUSPENSO',
        ],
      },
    },
  });
}

export interface FiltroRelatorio {
  tipoProcessoId?: number;
  setorId?: number;
  status?: ProcessoStatus;
  desde?: Date;
  ate?: Date;
}

export interface GargaloEtapa {
  etapa: string;
  total: number;
  mediaDias: number;
  maxDias: number;
}

export interface PainelProcessos {
  totalProcessos: number;
  porStatus: Array<{ status: string; total: number }>;
  porTipoProcesso: Array<{ tipo: string; total: number }>;
  etapasAtrasadas: number;
  porEtapaAtual: Array<{ etapa: string; total: number }>;
  gargalos: GargaloEtapa[];
  processosSemMovimentacao: number;
  devolucoes: number;
}

function condicoesRelatorio(
  filtro: FiltroRelatorio,
): { sql: string; replacements: Record<string, unknown> } {
  const condicoes: string[] = [];
  const replacements: Record<string, unknown> = {};
  if (filtro.tipoProcessoId !== undefined) {
    condicoes.push('p.tipo_processo_id = :tipoProcessoId');
    replacements.tipoProcessoId = filtro.tipoProcessoId;
  }
  if (filtro.setorId !== undefined) {
    condicoes.push('p.setor_atual_id = :setorId');
    replacements.setorId = filtro.setorId;
  }
  if (filtro.status !== undefined) {
    condicoes.push('p.status = :status');
    replacements.status = filtro.status;
  }
  if (filtro.desde !== undefined) {
    condicoes.push('p.created_at >= :desde');
    replacements.desde = filtro.desde;
  }
  if (filtro.ate !== undefined) {
    condicoes.push('p.created_at <= :ate');
    replacements.ate = filtro.ate;
  }
  return {
    sql: condicoes.length > 0 ? `AND ${condicoes.join(' AND ')}` : '',
    replacements,
  };
}

function numero(valor: number | string | null | undefined): number {
  return Number(valor ?? 0);
}

/**
 * Indicadores gerenciais para o painel. As consultas usam parâmetros nomeados
 * (sem interpolação de valores) e os filtros são validados por Zod.
 */
export async function painelProcessos(
  filtro: FiltroRelatorio,
  diasSemMovimentacao = 7,
): Promise<PainelProcessos> {
  const { sql, replacements } = condicoesRelatorio(filtro);

  const [totalRow] = await sequelize.query<{ total: number | string }>(
    `SELECT COUNT(*) AS total FROM processos p WHERE 1 = 1 ${sql}`,
    { type: QueryTypes.SELECT, replacements },
  );

  const porStatus = await sequelize.query<{
    status: string;
    total: number | string;
  }>(
    `SELECT p.status, COUNT(*) AS total
       FROM processos p
      WHERE 1 = 1 ${sql}
      GROUP BY p.status
      ORDER BY p.status`,
    { type: QueryTypes.SELECT, replacements },
  );

  const porTipo = await sequelize.query<{
    tipo: string;
    total: number | string;
  }>(
    `SELECT tp.nome AS tipo, COUNT(p.id) AS total
       FROM tipos_processo tp
       LEFT JOIN processos p ON p.tipo_processo_id = tp.id ${sql}
      GROUP BY tp.id, tp.nome
      ORDER BY tp.nome`,
    { type: QueryTypes.SELECT, replacements },
  );

  const [atrasadasRow] = await sequelize.query<{ total: number | string }>(
    `SELECT COUNT(*) AS total
       FROM processo_etapas pe
       JOIN processos p ON p.id = pe.processo_id
      WHERE pe.status = 'EM_ANDAMENTO'
        AND pe.data_prevista IS NOT NULL
        AND pe.data_prevista < NOW() ${sql}`,
    { type: QueryTypes.SELECT, replacements },
  );

  const porEtapaAtual = await sequelize.query<{
    etapa: string;
    total: number | string;
  }>(
    `SELECT pe.nome AS etapa, COUNT(*) AS total
       FROM processos p
       JOIN processo_etapas pe ON pe.id = p.processo_etapa_atual_id
      WHERE 1 = 1 ${sql}
      GROUP BY pe.nome
      ORDER BY total DESC
      LIMIT 10`,
    { type: QueryTypes.SELECT, replacements },
  );

  const gargalos = await sequelize.query<{
    etapa: string;
    total: number | string;
    media_dias: number | string;
    max_dias: number | string;
  }>(
    `SELECT pe.nome AS etapa,
            COUNT(*) AS total,
            AVG(TIMESTAMPDIFF(HOUR, pe.data_inicio, pe.data_conclusao)) / 24 AS media_dias,
            MAX(TIMESTAMPDIFF(HOUR, pe.data_inicio, pe.data_conclusao)) / 24 AS max_dias
       FROM processo_etapas pe
       JOIN processos p ON p.id = pe.processo_id
      WHERE pe.data_inicio IS NOT NULL
        AND pe.data_conclusao IS NOT NULL ${sql}
      GROUP BY pe.nome
      ORDER BY media_dias DESC
      LIMIT 10`,
    { type: QueryTypes.SELECT, replacements },
  );

  const [semMovRow] = await sequelize.query<{ total: number | string }>(
    `SELECT COUNT(*) AS total
       FROM processos p
      WHERE p.status = 'EM_ANDAMENTO' ${sql}
        AND NOT EXISTS (
          SELECT 1 FROM movimentacoes m
           WHERE m.processo_id = p.id
             AND m.created_at >= DATE_SUB(NOW(), INTERVAL :diasSemMovimentacao DAY)
        )`,
    {
      type: QueryTypes.SELECT,
      replacements: { ...replacements, diasSemMovimentacao },
    },
  );

  const [devolucoesRow] = await sequelize.query<{ total: number | string }>(
    `SELECT COUNT(*) AS total
       FROM movimentacoes m
       JOIN processos p ON p.id = m.processo_id
      WHERE m.tipo = 'DEVOLUCAO' ${sql}`,
    { type: QueryTypes.SELECT, replacements },
  );

  return {
    totalProcessos: numero(totalRow?.total),
    porStatus: porStatus.map((linha) => ({
      status: linha.status,
      total: numero(linha.total),
    })),
    porTipoProcesso: porTipo.map((linha) => ({
      tipo: linha.tipo,
      total: numero(linha.total),
    })),
    etapasAtrasadas: numero(atrasadasRow?.total),
    porEtapaAtual: porEtapaAtual.map((linha) => ({
      etapa: linha.etapa,
      total: numero(linha.total),
    })),
    gargalos: gargalos.map((linha) => ({
      etapa: linha.etapa,
      total: numero(linha.total),
      mediaDias: Math.round(numero(linha.media_dias) * 10) / 10,
      maxDias: Math.round(numero(linha.max_dias) * 10) / 10,
    })),
    processosSemMovimentacao: numero(semMovRow?.total),
    devolucoes: numero(devolucoesRow?.total),
  };
}
