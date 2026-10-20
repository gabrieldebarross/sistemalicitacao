import { Router } from 'express';

import * as controller from '../controllers/role.controller.js';
import { PERMISSIONS } from '../domain/permissions.js';
import {
  exigirAlgumaPermissao,
  exigirPermissao,
} from '../middlewares/auth.middleware.js';

export const roleRouter: Router = Router();

roleRouter.get('/', exigirPermissao(PERMISSIONS.ROLES_READ), controller.listar);
roleRouter.get(
  '/permissoes',
  exigirPermissao(PERMISSIONS.ROLES_READ),
  controller.listarPermissoes,
);
roleRouter.get(
  '/:id',
  exigirPermissao(PERMISSIONS.ROLES_READ),
  controller.buscar,
);
roleRouter.put(
  '/:id/permissoes',
  exigirAlgumaPermissao([
    PERMISSIONS.ROLES_MANAGE,
    PERMISSIONS.PERMISSIONS_MANAGE,
  ]),
  controller.definirPermissoes,
);
roleRouter.patch(
  '/:id',
  exigirPermissao(PERMISSIONS.ROLES_MANAGE),
  controller.atualizar,
);
