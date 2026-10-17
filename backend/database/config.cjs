/*
 * Configuração do sequelize-cli (CommonJS, para compatibilidade com a CLI).
 * Lê as mesmas variáveis do runtime (`backend/.env` e, em seguida, `.env` da
 * raiz do monorepo). Valores vazios são tratados como não definidos.
 */
const path = require('node:path');

require('dotenv').config({
  path: [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
  ],
  quiet: true,
});

const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT || 3306);
const username = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'sistema_licitacoes';

const base = {
  host,
  port,
  username,
  password,
  dialect: 'mysql',
  logging: false,
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_seeders',
  define: {
    underscored: true,
    timestamps: true,
  },
};

module.exports = {
  development: { ...base, database },
  test: { ...base, database: `${database}_test` },
  production: { ...base, database },
};
