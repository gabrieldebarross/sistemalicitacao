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
import type { FluxoSituacao } from '../domain/enums.js';
import type { Fase } from './fase.js';
import type { TipoProcesso } from './tipo-processo.js';

/** Versão de fluxo de trabalho de um tipo de processo. */
export class Fluxo extends Model<
  InferAttributes<Fluxo>,
  InferCreationAttributes<Fluxo>
> {
  declare id: CreationOptional<number>;
  declare tipoProcessoId: ForeignKey<number>;
  declare nome: string;
  declare descricao: CreationOptional<string | null>;
  declare versao: CreationOptional<number>;
  declare situacao: CreationOptional<FluxoSituacao>;
  declare publicadoEm: CreationOptional<Date | null>;
  declare publicadoPorId: ForeignKey<number | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare tipoProcesso?: NonAttribute<TipoProcesso>;
  declare fases?: NonAttribute<Fase[]>;
}

Fluxo.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    tipoProcessoId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    nome: { type: DataTypes.STRING(150), allowNull: false },
    descricao: { type: DataTypes.TEXT, allowNull: true },
    versao: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    situacao: {
      type: DataTypes.ENUM('RASCUNHO', 'PUBLICADO', 'ARQUIVADO'),
      allowNull: false,
      defaultValue: 'RASCUNHO',
    },
    publicadoEm: { type: DataTypes.DATE, allowNull: true },
    publicadoPorId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'fluxos',
    freezeTableName: true,
    underscored: true,
  },
);
