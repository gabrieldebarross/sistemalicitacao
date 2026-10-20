import { Router } from 'express';

import * as controller from '../controllers/cargo.controller.js';
import { PERMISSIONS } from '../domain/permissions.js';
import { exigirPermissao } from '../middlewares/auth.middleware.js';

export const cargoRouter: Router = Router();

cargoRouter.get(
  '/',
  exigirPermissao(PERMISSIONS.PROCESSOS_READ),
  controller.listar,
);
cargoRouter.get(
  '/:id',
  exigirPermissao(PERMISSIONS.PROCESSOS_READ),
  controller.buscar,
);
cargoRouter.post(
  '/',
  exigirPermissao(PERMISSIONS.CARGOS_MANAGE),
  controller.criar,
);
cargoRouter.patch(
  '/:id',
  exigirPermissao(PERMISSIONS.CARGOS_MANAGE),
  controller.atualizar,
);
