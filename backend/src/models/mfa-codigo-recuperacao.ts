import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';

import { sequelize } from '../config/database.js';

/** Código de recuperação de MFA de uso único. */
export class MfaCodigoRecuperacao extends Model<
  InferAttributes<MfaCodigoRecuperacao>,
  InferCreationAttributes<MfaCodigoRecuperacao>
> {
  declare id: CreationOptional<number>;
  declare usuarioId: ForeignKey<number>;
  declare codigoHash: string;
  declare usadoEm: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
}

MfaCodigoRecuperacao.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    usuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    codigoHash: { type: DataTypes.CHAR(64), allowNull: false },
    usadoEm: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'mfa_codigos_recuperacao',
    freezeTableName: true,
    underscored: true,
    updatedAt: false,
  },
);
