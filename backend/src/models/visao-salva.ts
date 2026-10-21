import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';

import { sequelize } from '../config/database.js';

/** Filtros de consulta de processos salvos por um usuário. */
export class VisaoSalva extends Model<
  InferAttributes<VisaoSalva>,
  InferCreationAttributes<VisaoSalva>
> {
  declare id: CreationOptional<number>;
  declare usuarioId: ForeignKey<number>;
  declare nome: string;
  declare filtros: Record<string, unknown>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

VisaoSalva.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    usuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    nome: { type: DataTypes.STRING(80), allowNull: false },
    filtros: { type: DataTypes.JSON, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'visoes_salvas',
    freezeTableName: true,
    underscored: true,
  },
);
