import { Router } from 'express';

import * as controller from '../controllers/auditoria.controller.js';
import { PERMISSIONS } from '../domain/permissions.js';
import { exigirPermissao } from '../middlewares/auth.middleware.js';

export const auditoriaRouter: Router = Router();

auditoriaRouter.get(
  '/',
  exigirPermissao(PERMISSIONS.AUDIT_READ),
  controller.listar,
);
