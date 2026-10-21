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
import type { Fase } from './fase.js';
import type { Setor } from './setor.js';
import type { Usuario } from './usuario.js';

/** Etapa configurada em um fluxo (ordem, obrigatoriedade, prazo interno). */
export class Etapa extends Model<
  InferAttributes<Etapa>,
  InferCreationAttributes<Etapa>
> {
  declare id: CreationOptional<number>;
  declare faseId: ForeignKey<number>;
  declare nome: string;
  declare ordem: number;
  declare obrigatoria: CreationOptional<boolean>;
  declare prazoGestaoDias: CreationOptional<number | null>;
  declare responsavelSetorId: ForeignKey<number | null>;
  declare responsavelCargoId: ForeignKey<number | null>;
  declare responsavelUsuarioId: ForeignKey<number | null>;
  declare descricao: CreationOptional<string | null>;
  declare requisitos: CreationOptional<string | null>;
  declare referenciaLegal: CreationOptional<string | null>;
  declare condicional: CreationOptional<boolean>;
  declare condicaoAplicabilidade: CreationOptional<string | null>;
  declare permitePulo: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare fase?: NonAttribute<Fase>;
  declare responsavelSetor?: NonAttribute<Setor>;
  declare responsavelCargo?: NonAttribute<Cargo>;
  declare responsavelUsuario?: NonAttribute<Usuario>;
}

Etapa.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    faseId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    nome: { type: DataTypes.STRING(150), allowNull: false },
    ordem: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    obrigatoria: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    prazoGestaoDias: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    responsavelSetorId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    responsavelCargoId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    responsavelUsuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    descricao: { type: DataTypes.TEXT, allowNull: true },
    requisitos: { type: DataTypes.TEXT, allowNull: true },
    referenciaLegal: { type: DataTypes.STRING(255), allowNull: true },
    condicional: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    condicaoAplicabilidade: { type: DataTypes.TEXT, allowNull: true },
    permitePulo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'etapas',
    freezeTableName: true,
    underscored: true,
  },
);
