import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
} from 'sequelize';

import { sequelize } from '../config/database.js';

/** Vínculo de usuário a setor, com indicação de setor principal. */
export class UserSectorAssignment extends Model<
  InferAttributes<UserSectorAssignment>,
  InferCreationAttributes<UserSectorAssignment>
> {
  declare id: CreationOptional<number>;
  declare usuarioId: ForeignKey<number>;
  declare setorId: ForeignKey<number>;
  declare principal: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

UserSectorAssignment.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    usuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    setorId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    principal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'user_sector_assignments',
    freezeTableName: true,
    underscored: true,
  },
);
