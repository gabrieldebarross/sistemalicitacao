import { Router } from 'express';

import { checkDatabaseConnection } from '../config/database.js';

export const healthRouter: Router = Router();

/**
 * Liveness: processo vivo e capaz de responder. Não depende de serviços externos.
 */
healthRouter.get('/', (_req, res) => {
  res.json({
    sucesso: true,
    dados: {
      status: 'ok',
      uptimeSegundos: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * Readiness: verifica dependências essenciais (banco de dados).
 */
healthRouter.get('/readiness', async (_req, res) => {
  const dbOk = await checkDatabaseConnection();
  if (!dbOk) {
    res.status(503).json({
      sucesso: false,
      mensagem: 'Serviço indisponível.',
      codigo: 'INDISPONIVEL',
    });
    return;
  }
  res.json({ sucesso: true, dados: { status: 'pronto' } });
});
