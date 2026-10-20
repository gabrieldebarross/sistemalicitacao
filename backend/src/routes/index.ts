import { Router } from 'express';

import { autenticar, exigirSenhaAlterada } from '../middlewares/auth.middleware.js';
import { protegerCsrf } from '../middlewares/csrf.middleware.js';
import { auditoriaRouter } from './auditoria.routes.js';
import { authRouter } from './auth.routes.js';
import { cargoRouter } from './cargo.routes.js';
import { fluxoRouter } from './fluxo.routes.js';
import { healthRouter } from './health.routes.js';
import { processoRouter } from './processo.routes.js';
import { relatorioRouter } from './relatorio.routes.js';
import { roleRouter } from './role.routes.js';
import { setorRouter } from './setor.routes.js';
import { tipoProcessoRouter } from './tipo-processo.routes.js';
import { usuarioRouter } from './usuario.routes.js';

export const apiRouter: Router = Router();

// Público
apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);

// Recursos protegidos: autenticação e CSRF aplicados por prefixo para que rotas
// inexistentes continuem retornando 404 (e não vazar existência).
// `exigirSenhaAlterada` bloqueia tudo enquanto a senha provisória não for
// trocada (as rotas de autenticação continuam acessíveis).
apiRouter.use('/cargos', autenticar, exigirSenhaAlterada, protegerCsrf, cargoRouter);
apiRouter.use('/setores', autenticar, exigirSenhaAlterada, protegerCsrf, setorRouter);
apiRouter.use('/tipos-processo', autenticar, exigirSenhaAlterada, protegerCsrf, tipoProcessoRouter);
apiRouter.use('/usuarios', autenticar, exigirSenhaAlterada, protegerCsrf, usuarioRouter);
apiRouter.use('/roles', autenticar, exigirSenhaAlterada, protegerCsrf, roleRouter);
apiRouter.use('/fluxos', autenticar, exigirSenhaAlterada, protegerCsrf, fluxoRouter);
apiRouter.use('/processos', autenticar, exigirSenhaAlterada, protegerCsrf, processoRouter);
apiRouter.use('/auditoria', autenticar, exigirSenhaAlterada, protegerCsrf, auditoriaRouter);
apiRouter.use('/relatorios', autenticar, exigirSenhaAlterada, protegerCsrf, relatorioRouter);
