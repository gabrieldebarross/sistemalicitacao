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
import type { ProcessoEtapaStatus } from '../domain/enums.js';
import type { Processo } from './processo.js';
import type { Setor } from './setor.js';
import type { Usuario } from './usuario.js';

/**
 * Ocorrência de uma etapa dentro de um processo. Copia (snapshot) os dados
 * relevantes da etapa de origem para preservar o histórico.
 */
export class ProcessoEtapa extends Model<
  InferAttributes<ProcessoEtapa>,
  InferCreationAttributes<ProcessoEtapa>
> {
  declare id: CreationOptional<number>;
  declare processoId: ForeignKey<number>;
  declare etapaId: ForeignKey<number | null>;
  declare sequencia: number;
  declare nome: string;
  declare faseNome: CreationOptional<string | null>;
  declare obrigatoria: CreationOptional<boolean>;
  declare status: CreationOptional<ProcessoEtapaStatus>;
  declare responsavelId: ForeignKey<number | null>;
  declare setorId: ForeignKey<number | null>;
  declare retornoParaEtapaId: CreationOptional<number | null>;
  declare prazoGestaoDias: CreationOptional<number | null>;
  declare dataInicio: CreationOptional<Date | null>;
  declare dataPrevista: CreationOptional<Date | null>;
  declare dataConclusao: CreationOptional<Date | null>;
  declare motivoBloqueio: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare processo?: NonAttribute<Processo>;
  declare responsavel?: NonAttribute<Usuario>;
  declare setor?: NonAttribute<Setor>;
}

ProcessoEtapa.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    processoId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    etapaId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    sequencia: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    nome: { type: DataTypes.STRING(150), allowNull: false },
    faseNome: { type: DataTypes.STRING(150), allowNull: true },
    obrigatoria: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    status: {
      type: DataTypes.ENUM(
        'PENDENTE',
        'EM_ANDAMENTO',
        'CONCLUIDA',
        'BLOQUEADA',
        'PULADA',
      ),
      allowNull: false,
      defaultValue: 'PENDENTE',
    },
    responsavelId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    setorId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    retornoParaEtapaId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    },
    prazoGestaoDias: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    dataInicio: { type: DataTypes.DATE, allowNull: true },
    dataPrevista: { type: DataTypes.DATE, allowNull: true },
    dataConclusao: { type: DataTypes.DATE, allowNull: true },
    motivoBloqueio: { type: DataTypes.TEXT, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'processo_etapas',
    freezeTableName: true,
    underscored: true,
  },
);
