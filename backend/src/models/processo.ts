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
import type { ProcessoStatus } from '../domain/enums.js';
import type { Fluxo } from './fluxo.js';
import type { ProcessoEtapa } from './processo-etapa.js';
import type { Setor } from './setor.js';
import type { TipoProcesso } from './tipo-processo.js';
import type { Usuario } from './usuario.js';

/** Instância real de um processo de contratação. */
export class Processo extends Model<
  InferAttributes<Processo>,
  InferCreationAttributes<Processo>
> {
  declare id: CreationOptional<number>;
  declare numero: string;
  declare objeto: string;
  declare descricao: CreationOptional<string | null>;
  declare tipoProcessoId: ForeignKey<number>;
  declare fluxoId: ForeignKey<number>;
  declare setorAtualId: ForeignKey<number | null>;
  declare responsavelAtualId: ForeignKey<number | null>;
  declare criadoPorId: ForeignKey<number | null>;
  declare status: CreationOptional<ProcessoStatus>;
  declare iniciadoEm: CreationOptional<Date | null>;
  declare finalizadoEm: CreationOptional<Date | null>;
  declare processoEtapaAtualId: ForeignKey<number | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare tipoProcesso?: NonAttribute<TipoProcesso>;
  declare fluxo?: NonAttribute<Fluxo>;
  declare setorAtual?: NonAttribute<Setor>;
  declare responsavelAtual?: NonAttribute<Usuario>;
  declare etapas?: NonAttribute<ProcessoEtapa[]>;
}

Processo.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    numero: { type: DataTypes.STRING(50), allowNull: false },
    objeto: { type: DataTypes.STRING(500), allowNull: false },
    descricao: { type: DataTypes.TEXT, allowNull: true },
    tipoProcessoId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    fluxoId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    setorAtualId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    responsavelAtualId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    criadoPorId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    status: {
      type: DataTypes.ENUM(
        'RASCUNHO',
        'EM_ANDAMENTO',
        'SUSPENSO',
        'CONCLUIDO',
        'ANULADO',
        'REVOGADO',
      ),
      allowNull: false,
      defaultValue: 'RASCUNHO',
    },
    iniciadoEm: { type: DataTypes.DATE, allowNull: true },
    finalizadoEm: { type: DataTypes.DATE, allowNull: true },
    processoEtapaAtualId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'processos',
    freezeTableName: true,
    underscored: true,
  },
);
