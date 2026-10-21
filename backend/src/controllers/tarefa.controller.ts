import type { Request, Response } from 'express';

import { listarTarefaQuerySchema } from '../schemas/index.js';
import * as tarefaService from '../services/tarefa.service.js';
import { usuarioAutenticado } from '../utils/contexto.js';
import { responderOk } from '../utils/http.js';
import { validar } from '../utils/validation.js';

export async function listar(req: Request, res: Response): Promise<void> {
  const query = validar(listarTarefaQuerySchema, req.query);
  const resultado = await tarefaService.listar(
    usuarioAutenticado(req),
    query,
  );
  res.json({
    sucesso: true,
    dados: resultado.itens,
    paginacao: {
      total: resultado.total,
      pagina: resultado.pagina,
      tamanhoPagina: resultado.tamanhoPagina,
      totalPaginas: resultado.totalPaginas,
    },
    resumo: resultado.resumo,
  });
}

export async function resumo(req: Request, res: Response): Promise<void> {
  responderOk(
    res,
    await tarefaService.resumo(usuarioAutenticado(req)),
  );
}
