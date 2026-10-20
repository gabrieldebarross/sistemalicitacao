import { Op, type WhereOptions } from 'sequelize';

import type { AuditoriaResultado } from '../domain/enums.js';
import { Auditoria } from '../models/auditoria.js';
import { Usuario } from '../models/usuario.js';

export interface CriarAuditoria {
  usuarioId: number | null;
  acao: string;
  recurso: string | null;
  recursoId: string | null;
  resultado: AuditoriaResultado;
  justificativa: string | null;
  correlacaoId: string | null;
  ip: string | null;
  metadados: Record<string, unknown> | null;
}

export interface FiltroAuditoria {
  usuarioId?: number;
  acao?: string;
  recurso?: string;
  desde?: Date;
  ate?: Date;
}

export async function criar(dados: CriarAuditoria): Promise<Auditoria> {
  return Auditoria.create(dados);
}

export async function listar(
  filtro: FiltroAuditoria,
  offset: number,
  limit: number,
): Promise<{ itens: Auditoria[]; total: number }> {
  const where: WhereOptions = {};
  if (filtro.usuarioId !== undefined) {
    where.usuarioId = filtro.usuarioId;
  }
  if (filtro.acao !== undefined) {
    where.acao = filtro.acao;
  }
  if (filtro.recurso !== undefined) {
    where.recurso = filtro.recurso;
  }
  if (filtro.desde !== undefined || filtro.ate !== undefined) {
    where.createdAt = {
      ...(filtro.desde ? { [Op.gte]: filtro.desde } : {}),
      ...(filtro.ate ? { [Op.lte]: filtro.ate } : {}),
    };
  }
  const { rows, count } = await Auditoria.findAndCountAll({
    where,
    include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nome'] }],
    order: [['created_at', 'DESC']],
    offset,
    limit,
    distinct: true,
  });
  return { itens: rows, total: count };
}
