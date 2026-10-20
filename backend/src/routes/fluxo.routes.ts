import { Router } from 'express';

import * as controller from '../controllers/fluxo.controller.js';
import { PERMISSIONS } from '../domain/permissions.js';
import { exigirPermissao } from '../middlewares/auth.middleware.js';

export const fluxoRouter: Router = Router();

fluxoRouter.get('/', exigirPermissao(PERMISSIONS.FLUXOS_READ), controller.listar);
fluxoRouter.post(
  '/',
  exigirPermissao(PERMISSIONS.FLUXOS_CREATE),
  controller.criar,
);

fluxoRouter.patch(
  '/fases/:id',
  exigirPermissao(PERMISSIONS.FLUXOS_UPDATE),
  controller.atualizarFase,
);
fluxoRouter.delete(
  '/fases/:id',
  exigirPermissao(PERMISSIONS.FLUXOS_UPDATE),
  controller.removerFase,
);
fluxoRouter.post(
  '/fases/:id/etapas',
  exigirPermissao(PERMISSIONS.FLUXOS_UPDATE),
  controller.criarEtapa,
);
fluxoRouter.patch(
  '/etapas/:id',
  exigirPermissao(PERMISSIONS.FLUXOS_UPDATE),
  controller.atualizarEtapa,
);
fluxoRouter.delete(
  '/etapas/:id',
  exigirPermissao(PERMISSIONS.FLUXOS_UPDATE),
  controller.removerEtapa,
);

fluxoRouter.get('/:id', exigirPermissao(PERMISSIONS.FLUXOS_READ), controller.detalhar);
fluxoRouter.patch(
  '/:id',
  exigirPermissao(PERMISSIONS.FLUXOS_UPDATE),
  controller.atualizar,
);
fluxoRouter.post(
  '/:id/publicar',
  exigirPermissao(PERMISSIONS.FLUXOS_PUBLISH),
  controller.publicar,
);
fluxoRouter.post(
  '/:id/arquivar',
  exigirPermissao(PERMISSIONS.FLUXOS_ARCHIVE),
  controller.arquivar,
);
fluxoRouter.post(
  '/:id/clonar',
  exigirPermissao(PERMISSIONS.FLUXOS_CLONE),
  controller.clonar,
);
fluxoRouter.post(
  '/:id/fases',
  exigirPermissao(PERMISSIONS.FLUXOS_UPDATE),
  controller.criarFase,
);
