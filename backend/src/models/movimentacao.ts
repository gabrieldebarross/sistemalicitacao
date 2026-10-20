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
import type { MovimentacaoTipo } from '../domain/enums.js';
import type { Setor } from './setor.js';
import type { Usuario } from './usuario.js';

/** Evento histórico do processo. Imutável (apenas `created_at`). */
export class Movimentacao extends Model<
  InferAttributes<Movimentacao>,
  InferCreationAttributes<Movimentacao>
> {
  declare id: CreationOptional<number>;
  declare processoId: ForeignKey<number>;
  declare processoEtapaId: ForeignKey<number | null>;
  declare usuarioId: ForeignKey<number | null>;
  declare setorId: ForeignKey<number | null>;
  declare tipo: MovimentacaoTipo;
  declare descricao: CreationOptional<string | null>;
  declare metadados: CreationOptional<Record<string, unknown> | null>;
  declare correlacaoId: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;

  declare usuario?: NonAttribute<Usuario>;
  declare setor?: NonAttribute<Setor>;
}

Movimentacao.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    processoId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    processoEtapaId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    usuarioId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    setorId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    tipo: {
      type: DataTypes.ENUM(
        'CRIACAO',
        'INICIO_ETAPA',
        'CONCLUSAO_ETAPA',
        'CONCLUSAO_PROCESSO',
        'ENCAMINHAMENTO',
        'DEVOLUCAO',
        'ALTERACAO',
        'SUSPENSAO',
        'RETOMADA',
        'OBSERVACAO',
      ),
      allowNull: false,
    },
    descricao: { type: DataTypes.TEXT, allowNull: true },
    metadados: { type: DataTypes.JSON, allowNull: true },
    correlacaoId: { type: DataTypes.STRING(64), allowNull: true },
    createdAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: 'movimentacoes',
    freezeTableName: true,
    underscored: true,
    updatedAt: false,
  },
);
