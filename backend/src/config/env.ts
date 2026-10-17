import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

const here = dirname(fileURLToPath(import.meta.url));

// Carrega variáveis de ambiente. Precedência: backend/.env e, em seguida, o
// .env na raiz do monorepo (para o layout atual). Valores já definidos no
// processo não são sobrescritos pelo dotenv.
loadEnv({
  path: [resolve(here, '../../.env'), resolve(here, '../../../.env')],
  quiet: true,
});

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  API_PREFIX: z.string().startsWith('/').default('/api'),

  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  CORS_ORIGIN: z.string().default('http://localhost:3001'),

  DB_HOST: z.string().min(1).default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().min(1).default('sistema_licitacoes'),
  DB_USER: z.string().min(1).default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_DIALECT: z.literal('mysql').default('mysql'),

  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('15m'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
});

// Valores vazios são tratados como "não definidos" para que os defaults atuem.
const source: Record<string, string> = {};
for (const [chave, valor] of Object.entries(process.env)) {
  if (valor !== undefined && valor !== '') {
    source[chave] = valor;
  }
}

const parsed = envSchema.safeParse(source);

if (!parsed.success) {
  // Não expor valores; apenas os nomes dos campos inválidos.
  const campos = parsed.error.issues
    .map((issue) => issue.path.join('.'))
    .filter(Boolean)
    .join(', ');
  throw new Error(
    `Configuração de ambiente inválida. Verifique as variáveis: ${campos}.`,
  );
}

const raw = parsed.data;

if (raw.NODE_ENV === 'production') {
  if (!raw.JWT_SECRET || raw.JWT_SECRET.length < 32) {
    throw new Error(
      'JWT_SECRET deve ser definido com ao menos 32 caracteres em produção.',
    );
  }
}

function parseCorsOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export const env = {
  nodeEnv: raw.NODE_ENV,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  port: raw.PORT,
  apiPrefix: raw.API_PREFIX,
  logLevel: raw.LOG_LEVEL,
  corsOrigins: parseCorsOrigins(raw.CORS_ORIGIN),
  bcryptSaltRounds: raw.BCRYPT_SALT_ROUNDS,
  jwt: {
    secret: raw.JWT_SECRET,
    expiresIn: raw.JWT_EXPIRES_IN,
  },
  db: {
    host: raw.DB_HOST,
    port: raw.DB_PORT,
    name: raw.DB_NAME,
    user: raw.DB_USER,
    password: raw.DB_PASSWORD,
    dialect: raw.DB_DIALECT,
  },
} as const;

export type Env = typeof env;
