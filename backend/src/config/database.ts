import { Sequelize } from 'sequelize';

import { env } from './env.js';

/**
 * Instância única do Sequelize para o runtime da aplicação.
 * Migrações e seeders usam configuração própria (sequelize-cli).
 */
export const sequelize = new Sequelize(
  env.db.name,
  env.db.user,
  env.db.password,
  {
    host: env.db.host,
    port: env.db.port,
    dialect: env.db.dialect,
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30_000,
      idle: 10_000,
    },
  },
);

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await sequelize.authenticate();
    return true;
  } catch {
    return false;
  }
}
