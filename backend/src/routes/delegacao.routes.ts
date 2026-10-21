import { Router } from 'express';

import * as controller from '../controllers/delegacao.controller.js';
import { PERMISSIONS } from '../domain/permissions.js';
import { exigirPermissao } from '../middlewares/auth.middleware.js';
import { protegerCsrf } from '../middlewares/csrf.middleware.js';

export const delegacaoRouter: Router = Router();

delegacaoRouter.use(
  exigirPermissao(PERMISSIONS.PROCESSOS_ASSIGN),
);

delegacaoRouter.get('/', controller.listar);
delegacaoRouter.post('/', protegerCsrf, controller.criar);
delegacaoRouter.delete('/:id', protegerCsrf, controller.cancelar);
