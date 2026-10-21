import { Router } from 'express';

import * as controller from '../controllers/tarefa.controller.js';
import { PERMISSIONS } from '../domain/permissions.js';
import { exigirPermissao } from '../middlewares/auth.middleware.js';

export const tarefaRouter: Router = Router();

tarefaRouter.get(
  '/',
  exigirPermissao(PERMISSIONS.PROCESSOS_READ),
  controller.listar,
);
tarefaRouter.get(
  '/resumo',
  exigirPermissao(PERMISSIONS.PROCESSOS_READ),
  controller.resumo,
);
