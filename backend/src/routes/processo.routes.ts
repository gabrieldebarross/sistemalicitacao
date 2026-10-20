import { Router } from 'express';

import * as controller from '../controllers/processo.controller.js';
import { PERMISSIONS } from '../domain/permissions.js';
import { exigirPermissao } from '../middlewares/auth.middleware.js';

export const processoRouter: Router = Router();

processoRouter.get(
  '/',
  exigirPermissao(PERMISSIONS.PROCESSOS_READ),
  controller.listar,
);
processoRouter.post(
  '/',
  exigirPermissao(PERMISSIONS.PROCESSOS_CREATE),
  controller.criar,
);
processoRouter.get(
  '/:id',
  exigirPermissao(PERMISSIONS.PROCESSOS_READ),
  controller.detalhar,
);
processoRouter.patch(
  '/:id',
  exigirPermissao(PERMISSIONS.PROCESSOS_UPDATE),
  controller.atualizar,
);
processoRouter.get(
  '/:id/movimentacoes',
  exigirPermissao(PERMISSIONS.PROCESSOS_READ),
  controller.movimentacoes,
);

processoRouter.post(
  '/:id/iniciar',
  exigirPermissao(PERMISSIONS.PROCESSOS_ADVANCE),
  controller.iniciar,
);
processoRouter.post(
  '/:id/etapas/:etapaId/concluir',
  exigirPermissao(PERMISSIONS.PROCESSOS_ADVANCE),
  controller.concluirEtapa,
);
processoRouter.post(
  '/:id/etapas/:etapaId/devolver',
  exigirPermissao(PERMISSIONS.PROCESSOS_RETURN),
  controller.devolverEtapa,
);
processoRouter.post(
  '/:id/atribuir',
  exigirPermissao(PERMISSIONS.PROCESSOS_ASSIGN),
  controller.atribuir,
);
processoRouter.post(
  '/:id/suspender',
  exigirPermissao(PERMISSIONS.PROCESSOS_SUSPEND),
  controller.suspender,
);
processoRouter.post(
  '/:id/retomar',
  exigirPermissao(PERMISSIONS.PROCESSOS_RESUME),
  controller.retomar,
);
processoRouter.post(
  '/:id/anular',
  exigirPermissao(PERMISSIONS.PROCESSOS_CANCEL),
  controller.anular,
);
processoRouter.post(
  '/:id/revogar',
  exigirPermissao(PERMISSIONS.PROCESSOS_CANCEL),
  controller.revogar,
);
processoRouter.post(
  '/:id/concluir',
  exigirPermissao(PERMISSIONS.PROCESSOS_CONCLUDE),
  controller.concluir,
);
