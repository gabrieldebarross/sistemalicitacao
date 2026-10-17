import { env } from '../config/env.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Readonly<Record<LogLevel, number>> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const metaExtra = (meta?: Record<string, unknown>): Record<string, unknown> =>
  meta ?? {};

function emit(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
): void {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[env.logLevel]) {
    return;
  }
  const entry = {
    nivel: level,
    msg: message,
    ts: new Date().toISOString(),
    ...metaExtra(meta),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else {
    console.log(line);
  }
}

/**
 * Log estruturado (JSON Lines). Nunca receber segredos, tokens, senhas ou
 * conteúdo sensível em `meta`.
 */
export const logger = {
  debug: (message: string, meta?: Record<string, unknown>): void =>
    emit('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>): void =>
    emit('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>): void =>
    emit('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>): void =>
    emit('error', message, meta),
};
