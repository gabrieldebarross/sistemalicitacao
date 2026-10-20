import { Router } from 'express';

import * as controller from '../controllers/auth.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { protegerCsrf } from '../middlewares/csrf.middleware.js';
import { limitarLogin } from '../middlewares/rate-limit.middleware.js';

export const authRouter: Router = Router();

authRouter.post('/login', limitarLogin, controller.login);
authRouter.post('/logout', controller.logout);
authRouter.get('/me', autenticar, controller.me);
authRouter.patch(
  '/me',
  autenticar,
  protegerCsrf,
  controller.atualizarPerfil,
);
authRouter.post(
  '/alterar-senha',
  autenticar,
  protegerCsrf,
  controller.alterarSenha,
);
