import { Router } from 'express';

import * as controller from '../controllers/relatorio.controller.js';
import { PERMISSIONS } from '../domain/permissions.js';
import { exigirPermissao } from '../middlewares/auth.middleware.js';

export const relatorioRouter: Router = Router();

relatorioRouter.get(
  '/resumo',
  exigirPermissao(PERMISSIONS.REPORTS_READ),
  controller.resumo,
);
