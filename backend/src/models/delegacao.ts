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
import type { Processo } from './processo.js';
import type { Usuario } from './usuario.js';

/** Delegação temporária de tarefas entre usuários. */
export class Delegacao extends Model<
  InferAttributes<Delegacao>,
  InferCreationAttributes<Delegacao>
> {
  declare id: CreationOptional<number>;
  declare origemUsuarioId: ForeignKey<number>;
  declare destinoUsuarioId: ForeignKey<number>;
  declare processoId: ForeignKey<number | null>;
  declare inicioEm: Date;
  declare fimEm: Date;
  declare motivo: string;
  declare canceladoEm: CreationOptional<Date | null>;
  declare canceladoPorId: ForeignKey<number | null>;
  declare criadoPorId: ForeignKey<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare origem?: NonAttribute<Usuario>;
  declare destino?: NonAttribute<Usuario>;
  declare processo?: NonAttribute<Processo | null>;
}

Delegacao.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    origemUsuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    destinoUsuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    processoId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    inicioEm: { type: DataTypes.DATE, allowNull: false },
    fimEm: { type: DataTypes.DATE, allowNull: false },
    motivo: { type: DataTypes.STRING(500), allowNull: false },
    canceladoEm: { type: DataTypes.DATE, allowNull: true },
    canceladoPorId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    criadoPorId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'delegacoes',
    freezeTableName: true,
    underscored: true,
  },
);
