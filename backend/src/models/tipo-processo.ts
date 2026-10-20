import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';

import { sequelize } from '../config/database.js';

/** Tipo de processo: modalidade ou hipótese de contratação direta. */
export class TipoProcesso extends Model<
  InferAttributes<TipoProcesso>,
  InferCreationAttributes<TipoProcesso>
> {
  declare id: CreationOptional<number>;
  declare nome: string;
  declare descricao: CreationOptional<string | null>;
  declare baseLegal: CreationOptional<string | null>;
  declare ativo: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

TipoProcesso.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: { type: DataTypes.STRING(120), allowNull: false },
    descricao: { type: DataTypes.TEXT, allowNull: true },
    baseLegal: { type: DataTypes.STRING(255), allowNull: true },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'tipos_processo',
    freezeTableName: true,
    underscored: true,
  },
);
