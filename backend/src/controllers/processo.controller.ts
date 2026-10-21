import type { Request, Response } from 'express';

import {
  atribuirEtapaSchema,
  atribuirProcessoSchema,
  atualizarPrazoEtapaSchema,
  atualizarProcessoSchema,
  bloquearEtapaSchema,
  concluirEtapaSchema,
  criarProcessoSchema,
  desbloquearEtapaSchema,
  devolverEtapaSchema,
  idParamSchema,
  justificativaSchema,
  listarProcessoQuerySchema,
  listarFluxosDisponiveisQuerySchema,
  processoEtapaParamSchema,
  pularEtapaSchema,
} from '../schemas/index.js';
import * as processoService from '../services/processo.service.js';
import { contextoDe } from '../utils/contexto.js';
import { responderOk, responderPaginado } from '../utils/http.js';
import { validar } from '../utils/validation.js';

export async function listar(req: Request, res: Response): Promise<void> {
  const query = validar(listarProcessoQuerySchema, req.query);
  responderPaginado(res, await processoService.listar(query));
}

export async function fluxosDisponiveis(
  req: Request,
  res: Response,
): Promise<void> {
  const { tipoProcessoId } = validar(
    listarFluxosDisponiveisQuerySchema,
    req.query,
  );
  responderOk(
    res,
    await processoService.fluxosDisponiveis(tipoProcessoId),
  );
}

export async function detalhar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(res, await processoService.detalhar(id));
}

export async function criar(req: Request, res: Response): Promise<void> {
  const dados = validar(criarProcessoSchema, req.body);
  responderOk(
    res,
    await processoService.criar(dados, contextoDe(req, res)),
    201,
  );
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const dados = validar(atualizarProcessoSchema, req.body);
  responderOk(
    res,
    await processoService.atualizarDados(id, dados, contextoDe(req, res)),
  );
}

export async function iniciar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(res, await processoService.iniciar(id, contextoDe(req, res)));
}

export async function concluirEtapa(
  req: Request,
  res: Response,
): Promise<void> {
  const { id, etapaId } = validar(processoEtapaParamSchema, req.params);
  const dados = validar(concluirEtapaSchema, req.body ?? {});
  responderOk(
    res,
    await processoService.concluirEtapa(
      id,
      etapaId,
      dados,
      contextoDe(req, res),
    ),
  );
}

export async function devolverEtapa(
  req: Request,
  res: Response,
): Promise<void> {
  const { id, etapaId } = validar(processoEtapaParamSchema, req.params);
  const dados = validar(devolverEtapaSchema, req.body);
  responderOk(
    res,
    await processoService.devolverEtapa(
      id,
      etapaId,
      dados,
      contextoDe(req, res),
    ),
  );
}

export async function atribuir(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const dados = validar(atribuirProcessoSchema, req.body);
  responderOk(
    res,
    await processoService.atribuir(id, dados, contextoDe(req, res)),
  );
}

export async function atribuirEtapa(
  req: Request,
  res: Response,
): Promise<void> {
  const { id, etapaId } = validar(processoEtapaParamSchema, req.params);
  const dados = validar(atribuirEtapaSchema, req.body);
  responderOk(
    res,
    await processoService.atribuirEtapa(
      id,
      etapaId,
      dados,
      contextoDe(req, res),
    ),
  );
}

export async function atualizarPrazoEtapa(
  req: Request,
  res: Response,
): Promise<void> {
  const { id, etapaId } = validar(processoEtapaParamSchema, req.params);
  const dados = validar(atualizarPrazoEtapaSchema, req.body);
  responderOk(
    res,
    await processoService.atualizarPrazoEtapa(
      id,
      etapaId,
      dados,
      contextoDe(req, res),
    ),
  );
}

export async function bloquearEtapa(
  req: Request,
  res: Response,
): Promise<void> {
  const { id, etapaId } = validar(processoEtapaParamSchema, req.params);
  const dados = validar(bloquearEtapaSchema, req.body);
  responderOk(
    res,
    await processoService.bloquearEtapa(
      id,
      etapaId,
      dados,
      contextoDe(req, res),
    ),
  );
}

export async function desbloquearEtapa(
  req: Request,
  res: Response,
): Promise<void> {
  const { id, etapaId } = validar(processoEtapaParamSchema, req.params);
  const dados = validar(desbloquearEtapaSchema, req.body);
  responderOk(
    res,
    await processoService.desbloquearEtapa(
      id,
      etapaId,
      dados,
      contextoDe(req, res),
    ),
  );
}

export async function pularEtapa(
  req: Request,
  res: Response,
): Promise<void> {
  const { id, etapaId } = validar(processoEtapaParamSchema, req.params);
  const dados = validar(pularEtapaSchema, req.body);
  responderOk(
    res,
    await processoService.pularEtapa(
      id,
      etapaId,
      dados,
      contextoDe(req, res),
    ),
  );
}

export async function suspender(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const { justificativa } = validar(justificativaSchema, req.body);
  responderOk(
    res,
    await processoService.suspender(id, justificativa, contextoDe(req, res)),
  );
}

export async function retomar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(res, await processoService.retomar(id, contextoDe(req, res)));
}

export async function anular(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const { justificativa } = validar(justificativaSchema, req.body);
  responderOk(
    res,
    await processoService.encerrar(
      id,
      'ANULADO',
      justificativa,
      contextoDe(req, res),
    ),
  );
}

export async function revogar(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const { justificativa } = validar(justificativaSchema, req.body);
  responderOk(
    res,
    await processoService.encerrar(
      id,
      'REVOGADO',
      justificativa,
      contextoDe(req, res),
    ),
  );
}

export async function concluir(req: Request, res: Response): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  const { justificativa } = validar(justificativaSchema, req.body);
  responderOk(
    res,
    await processoService.encerrar(
      id,
      'CONCLUIDO',
      justificativa,
      contextoDe(req, res),
    ),
  );
}

export async function movimentacoes(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validar(idParamSchema, req.params);
  responderOk(res, await processoService.movimentacoes(id));
}
