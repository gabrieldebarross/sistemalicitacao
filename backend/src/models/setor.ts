import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';

import { sequelize } from '../config/database.js';

/** Unidade administrativa. */
export class Setor extends Model<
  InferAttributes<Setor>,
  InferCreationAttributes<Setor>
> {
  declare id: CreationOptional<number>;
  declare nome: string;
  declare sigla: CreationOptional<string | null>;
  declare ativo: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Setor.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: { type: DataTypes.STRING(150), allowNull: false },
    sigla: { type: DataTypes.STRING(30), allowNull: true },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'setores',
    freezeTableName: true,
    underscored: true,
  },
);
