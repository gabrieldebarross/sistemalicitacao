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
import type { Cargo } from './cargo.js';
import type { Role } from './role.js';

/** Servidor/operador do sistema. */
export class Usuario extends Model<
  InferAttributes<Usuario>,
  InferCreationAttributes<Usuario>
> {
  declare id: CreationOptional<number>;
  declare nome: string;
  declare email: string;
  declare senhaHash: string;
  declare senhaProvisoria: CreationOptional<boolean>;
  declare cargoId: ForeignKey<number | null>;
  declare papelPrincipalId: ForeignKey<number | null>;
  declare ativo: CreationOptional<boolean>;
  declare ultimoAcessoEm: CreationOptional<Date | null>;
  declare tentativasFalhas: CreationOptional<number>;
  declare bloqueadoAte: CreationOptional<Date | null>;
  declare mfaSegredoCriptografado: CreationOptional<string | null>;
  declare mfaAtivo: CreationOptional<boolean>;
  declare mfaConfiguradoEm: CreationOptional<Date | null>;
  declare mfaResetadoEm: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare cargo?: NonAttribute<Cargo>;
  declare papelPrincipal?: NonAttribute<Role | null>;
  declare roles?: NonAttribute<Role[]>;
}

Usuario.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(180), allowNull: false },
    senhaHash: { type: DataTypes.STRING(255), allowNull: false },
    senhaProvisoria: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    cargoId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    papelPrincipalId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ultimoAcessoEm: { type: DataTypes.DATE, allowNull: true },
    tentativasFalhas: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    bloqueadoAte: { type: DataTypes.DATE, allowNull: true },
    mfaSegredoCriptografado: { type: DataTypes.TEXT, allowNull: true },
    mfaAtivo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    mfaConfiguradoEm: { type: DataTypes.DATE, allowNull: true },
    mfaResetadoEm: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'usuarios',
    freezeTableName: true,
    underscored: true,
  },
);
