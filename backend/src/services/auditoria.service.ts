import type { AuditoriaResultado } from '../domain/enums.js';
import * as auditoriaRepo from '../repositories/auditoria.repository.js';
import type { ContextoRequisicao } from '../types/context.js';
import { logger } from '../utils/logger.js';

export interface EventoAuditoria {
  acao: string;
  recurso: string;
  recursoId: string | number | null;
  resultado?: AuditoriaResultado;
  justificativa?: string | null;
  metadados?: Record<string, unknown> | null;
}

/**
 * Registra um evento de auditoria. Falhas ao auditar não devem interromper o
 * caso de uso, mas são registradas no log estruturado.
 */
export async function registrar(
  contexto: ContextoRequisicao,
  evento: EventoAuditoria,
): Promise<void> {
  try {
    await auditoriaRepo.criar({
      usuarioId: contexto.usuarioId,
      acao: evento.acao,
      recurso: evento.recurso,
      recursoId:
        evento.recursoId === null ? null : String(evento.recursoId),
      resultado: evento.resultado ?? 'SUCESSO',
      justificativa: evento.justificativa ?? null,
      correlacaoId: contexto.requestId,
      ip: contexto.ip,
      metadados: evento.metadados ?? null,
    });
  } catch (erro) {
    logger.error('falha ao registrar auditoria', {
      requestId: contexto.requestId,
      acao: evento.acao,
      erro: erro instanceof Error ? erro.name : typeof erro,
    });
  }
}

export async function listar(
  filtro: auditoriaRepo.FiltroAuditoria,
  offset: number,
  limit: number,
): Promise<{ itens: AuditoriaItem[]; total: number }> {
  const { itens, total } = await auditoriaRepo.listar(filtro, offset, limit);
  return { itens: itens.map(toItem), total };
}

export interface AuditoriaItem {
  id: number;
  usuario: { id: number; nome: string } | null;
  acao: string;
  recurso: string | null;
  recursoId: string | null;
  resultado: string;
  justificativa: string | null;
  correlacaoId: string | null;
  ip: string | null;
  metadados: Record<string, unknown> | null;
  criadoEm: Date;
}

type AuditoriaModel = Awaited<
  ReturnType<typeof auditoriaRepo.listar>
>['itens'][number];

function toItem(model: AuditoriaModel): AuditoriaItem {
  const usuario = model.usuario;
  return {
    id: model.id,
    usuario: usuario ? { id: usuario.id, nome: usuario.nome } : null,
    acao: model.acao,
    recurso: model.recurso,
    recursoId: model.recursoId,
    resultado: model.resultado,
    justificativa: model.justificativa,
    correlacaoId: model.correlacaoId,
    ip: model.ip,
    metadados: model.metadados,
    criadoEm: model.createdAt,
  };
}
