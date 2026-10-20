import { Router } from 'express';

import * as controller from '../controllers/setor.controller.js';
import { PERMISSIONS } from '../domain/permissions.js';
import { exigirPermissao } from '../middlewares/auth.middleware.js';

export const setorRouter: Router = Router();

setorRouter.get(
  '/',
  exigirPermissao(PERMISSIONS.PROCESSOS_READ),
  controller.listar,
);
setorRouter.get(
  '/:id',
  exigirPermissao(PERMISSIONS.PROCESSOS_READ),
  controller.buscar,
);
setorRouter.post(
  '/',
  exigirPermissao(PERMISSIONS.SETORES_MANAGE),
  controller.criar,
);
setorRouter.patch(
  '/:id',
  exigirPermissao(PERMISSIONS.SETORES_MANAGE),
  controller.atualizar,
);
