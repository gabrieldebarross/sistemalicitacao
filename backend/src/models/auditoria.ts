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
import type { AuditoriaResultado } from '../domain/enums.js';
import type { Usuario } from './usuario.js';

/** Registro de auditoria de segurança. Imutável (apenas `created_at`). */
export class Auditoria extends Model<
  InferAttributes<Auditoria>,
  InferCreationAttributes<Auditoria>
> {
  declare id: CreationOptional<number>;
  declare usuarioId: ForeignKey<number | null>;
  declare acao: string;
  declare recurso: CreationOptional<string | null>;
  declare recursoId: CreationOptional<string | null>;
  declare resultado: CreationOptional<AuditoriaResultado>;
  declare justificativa: CreationOptional<string | null>;
  declare correlacaoId: CreationOptional<string | null>;
  declare ip: CreationOptional<string | null>;
  declare metadados: CreationOptional<Record<string, unknown> | null>;
  declare createdAt: CreationOptional<Date>;

  declare usuario?: NonAttribute<Usuario>;
}

Auditoria.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    usuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    acao: { type: DataTypes.STRING(100), allowNull: false },
    recurso: { type: DataTypes.STRING(100), allowNull: true },
    recursoId: { type: DataTypes.STRING(64), allowNull: true },
    resultado: {
      type: DataTypes.ENUM('SUCESSO', 'FALHA'),
      allowNull: false,
      defaultValue: 'SUCESSO',
    },
    justificativa: { type: DataTypes.TEXT, allowNull: true },
    correlacaoId: { type: DataTypes.STRING(64), allowNull: true },
    ip: { type: DataTypes.STRING(45), allowNull: true },
    metadados: { type: DataTypes.JSON, allowNull: true },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'auditoria',
    freezeTableName: true,
    underscored: true,
    updatedAt: false,
  },
);
