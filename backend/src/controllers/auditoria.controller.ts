import type { Request, Response } from 'express';

import { listarAuditoriaQuerySchema } from '../schemas/index.js';
import * as auditoriaService from '../services/auditoria.service.js';
import { responderPaginado } from '../utils/http.js';
import { resolverPaginacao } from '../utils/pagination.js';
import { validar } from '../utils/validation.js';

export async function listar(req: Request, res: Response): Promise<void> {
  const query = validar(listarAuditoriaQuerySchema, req.query);
  const { offset, limit } = resolverPaginacao(query);
  const filtro: Parameters<typeof auditoriaService.listar>[0] = {};
  if (query.usuarioId !== undefined) {
    filtro.usuarioId = query.usuarioId;
  }
  if (query.acao !== undefined) {
    filtro.acao = query.acao;
  }
  if (query.recurso !== undefined) {
    filtro.recurso = query.recurso;
  }
  if (query.desde !== undefined) {
    filtro.desde = query.desde;
  }
  if (query.ate !== undefined) {
    filtro.ate = query.ate;
  }
  const { itens, total } = await auditoriaService.listar(filtro, offset, limit);
  responderPaginado(res, {
    itens,
    total,
    pagina: query.pagina,
    tamanhoPagina: query.tamanhoPagina,
    totalPaginas: Math.ceil(total / query.tamanhoPagina),
  });
}
