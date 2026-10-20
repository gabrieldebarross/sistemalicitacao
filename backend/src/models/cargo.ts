import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';

import { sequelize } from '../config/database.js';

/**
 * Cargo funcional. Armazena apenas o nome normalizado e, para rastreabilidade,
 * o valor original (ADR 0004).
 */
export class Cargo extends Model<
  InferAttributes<Cargo>,
  InferCreationAttributes<Cargo>
> {
  declare id: CreationOptional<number>;
  declare nome: string;
  declare nomeOriginal: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Cargo.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: { type: DataTypes.STRING(150), allowNull: false },
    nomeOriginal: { type: DataTypes.STRING(200), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'cargos',
    freezeTableName: true,
    underscored: true,
  },
);
