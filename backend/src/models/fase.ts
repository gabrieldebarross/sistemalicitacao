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
import type { Etapa } from './etapa.js';
import type { Fluxo } from './fluxo.js';

/** Agrupamento ordenado de etapas dentro de um fluxo. */
export class Fase extends Model<
  InferAttributes<Fase>,
  InferCreationAttributes<Fase>
> {
  declare id: CreationOptional<number>;
  declare fluxoId: ForeignKey<number>;
  declare nome: string;
  declare ordem: number;
  declare descricao: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare fluxo?: NonAttribute<Fluxo>;
  declare etapas?: NonAttribute<Etapa[]>;
}

Fase.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    fluxoId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    nome: { type: DataTypes.STRING(150), allowNull: false },
    ordem: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    descricao: { type: DataTypes.TEXT, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'fases',
    freezeTableName: true,
    underscored: true,
  },
);
