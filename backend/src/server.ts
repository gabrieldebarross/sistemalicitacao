import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info('servidor iniciado', {
    porta: env.port,
    ambiente: env.nodeEnv,
  });
});

function shutdown(signal: string): void {
  logger.info('encerrando servidor', { sinal: signal });
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
