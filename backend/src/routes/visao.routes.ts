import { Router } from 'express';

import * as controller from '../controllers/visao.controller.js';
import { protegerCsrf } from '../middlewares/csrf.middleware.js';

export const visaoRouter: Router = Router();

visaoRouter.get('/', controller.listar);
visaoRouter.post('/', protegerCsrf, controller.criar);
visaoRouter.patch('/:id', protegerCsrf, controller.atualizar);
visaoRouter.delete('/:id', protegerCsrf, controller.remover);
