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
import type { Role } from './role.js';

/** Atribuição de papel a usuário. */
export class UserRole extends Model<
  InferAttributes<UserRole>,
  InferCreationAttributes<UserRole>
> {
  declare id: CreationOptional<number>;
  declare usuarioId: ForeignKey<number>;
  declare roleId: ForeignKey<number>;
  declare atribuidoPorId: ForeignKey<number | null>;
  declare atribuidoEm: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare role?: NonAttribute<Role>;
}

UserRole.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    usuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    roleId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    atribuidoPorId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    atribuidoEm: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'user_roles',
    freezeTableName: true,
    underscored: true,
  },
);
