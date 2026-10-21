import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';

import { sequelize } from '../config/database.js';

/** Hash de senha anterior, usado para impedir reutilização recente. */
export class SenhaHistorico extends Model<
  InferAttributes<SenhaHistorico>,
  InferCreationAttributes<SenhaHistorico>
> {
  declare id: CreationOptional<number>;
  declare usuarioId: ForeignKey<number>;
  declare senhaHash: string;
  declare createdAt: CreationOptional<Date>;
}

SenhaHistorico.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    usuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    senhaHash: { type: DataTypes.STRING(255), allowNull: false },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'senhas_historico',
    freezeTableName: true,
    underscored: true,
    updatedAt: false,
  },
);
