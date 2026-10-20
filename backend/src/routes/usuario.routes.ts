import { Router } from 'express';

import * as controller from '../controllers/usuario.controller.js';
import { PERMISSIONS } from '../domain/permissions.js';
import {
  exigirAlgumaPermissao,
  exigirPermissao,
} from '../middlewares/auth.middleware.js';

export const usuarioRouter: Router = Router();

usuarioRouter.get(
  '/',
  exigirPermissao(PERMISSIONS.USUARIOS_READ),
  controller.listar,
);
usuarioRouter.get(
  '/atribuiveis',
  exigirAlgumaPermissao([
    PERMISSIONS.USUARIOS_READ,
    PERMISSIONS.PROCESSOS_ASSIGN,
    PERMISSIONS.FLUXOS_ASSIGN,
  ]),
  controller.listarAtribuiveis,
);
usuarioRouter.get(
  '/:id',
  exigirPermissao(PERMISSIONS.USUARIOS_READ),
  controller.buscar,
);
usuarioRouter.post(
  '/',
  exigirPermissao(PERMISSIONS.USUARIOS_CREATE),
  controller.criar,
);
usuarioRouter.patch(
  '/:id',
  exigirPermissao(PERMISSIONS.USUARIOS_UPDATE),
  controller.atualizar,
);
usuarioRouter.put(
  '/:id/roles',
  exigirPermissao(PERMISSIONS.ROLES_MANAGE),
  controller.definirRoles,
);
usuarioRouter.post(
  '/:id/desativar',
  exigirPermissao(PERMISSIONS.USUARIOS_DEACTIVATE),
  controller.desativar,
);
