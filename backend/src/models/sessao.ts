import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  type NonAttribute,
} from 'sequelize';

import { sequelize } from '../config/database.js';
import type { Usuario } from './usuario.js';

export type SessaoEstado = 'ATIVA' | 'MFA_PENDENTE';

/** Sessão autenticada revogável. */
export class Sessao extends Model<
  InferAttributes<Sessao>,
  InferCreationAttributes<Sessao>
> {
  declare id: CreationOptional<string>;
  declare usuarioId: ForeignKey<number>;
  declare refreshTokenHash: CreationOptional<string | null>;
  declare refreshTokenAnteriorHash: CreationOptional<string | null>;
  declare refreshRotacionadoEm: CreationOptional<Date | null>;
  declare estado: CreationOptional<SessaoEstado>;
  declare mfaConfiguracaoPendente: CreationOptional<boolean>;
  declare mfaTentativas: CreationOptional<number>;
  declare expiraEm: Date;
  declare revogadaEm: CreationOptional<Date | null>;
  declare ultimoUsoEm: CreationOptional<Date | null>;
  declare ip: CreationOptional<string | null>;
  declare userAgent: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare usuario?: NonAttribute<Usuario>;
}

Sessao.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
    usuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    refreshTokenHash: { type: DataTypes.CHAR(64), allowNull: true },
    refreshTokenAnteriorHash: { type: DataTypes.CHAR(64), allowNull: true },
    refreshRotacionadoEm: { type: DataTypes.DATE, allowNull: true },
    estado: {
      type: DataTypes.ENUM('ATIVA', 'MFA_PENDENTE'),
      allowNull: false,
      defaultValue: 'ATIVA',
    },
    mfaConfiguracaoPendente: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    mfaTentativas: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    expiraEm: { type: DataTypes.DATE, allowNull: false },
    revogadaEm: { type: DataTypes.DATE, allowNull: true },
    ultimoUsoEm: { type: DataTypes.DATE, allowNull: true },
    ip: { type: DataTypes.STRING(45), allowNull: true },
    userAgent: { type: DataTypes.STRING(255), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'sessoes',
    freezeTableName: true,
    underscored: true,
  },
);
