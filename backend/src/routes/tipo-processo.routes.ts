import { Router } from 'express';

import * as controller from '../controllers/tipo-processo.controller.js';
import { PERMISSIONS } from '../domain/permissions.js';
import { exigirPermissao } from '../middlewares/auth.middleware.js';

export const tipoProcessoRouter: Router = Router();

tipoProcessoRouter.get(
  '/',
  exigirPermissao(PERMISSIONS.PROCESSOS_READ),
  controller.listar,
);
tipoProcessoRouter.get(
  '/:id',
  exigirPermissao(PERMISSIONS.PROCESSOS_READ),
  controller.buscar,
);
tipoProcessoRouter.post(
  '/',
  exigirPermissao(PERMISSIONS.TIPOS_PROCESSO_MANAGE),
  controller.criar,
);
tipoProcessoRouter.patch(
  '/:id',
  exigirPermissao(PERMISSIONS.TIPOS_PROCESSO_MANAGE),
  controller.atualizar,
);
