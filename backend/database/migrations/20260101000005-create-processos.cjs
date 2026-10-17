'use strict';

/**
 * Processos, instâncias de etapas e movimentações.
 *
 * `processo_etapas` guarda uma cópia (snapshot) dos dados da etapa de origem
 * para preservar o histórico mesmo que o fluxo seja alterado depois.
 * `movimentacoes` é imutável (apenas created_at).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const timestamps = {
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    };

    await queryInterface.createTable('processos', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      numero: { type: Sequelize.STRING(50), allowNull: false },
      objeto: { type: Sequelize.STRING(500), allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      tipo_processo_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'tipos_processo', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      fluxo_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'fluxos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      setor_atual_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'setores', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      responsavel_atual_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      criado_por_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM(
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
      iniciado_em: { type: Sequelize.DATE, allowNull: true },
      finalizado_em: { type: Sequelize.DATE, allowNull: true },
      ...timestamps,
    });
    await queryInterface.addIndex('processos', ['numero'], {
      unique: true,
      name: 'uq_processos_numero',
    });
    await queryInterface.addIndex('processos', ['status'], {
      name: 'ix_processos_status',
    });
    await queryInterface.addIndex('processos', ['tipo_processo_id'], {
      name: 'ix_processos_tipo_processo_id',
    });
    await queryInterface.addIndex('processos', ['fluxo_id'], {
      name: 'ix_processos_fluxo_id',
    });
    await queryInterface.addIndex('processos', ['setor_atual_id'], {
      name: 'ix_processos_setor_atual_id',
    });
    await queryInterface.addIndex('processos', ['responsavel_atual_id'], {
      name: 'ix_processos_responsavel_atual_id',
    });

    await queryInterface.createTable('processo_etapas', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      processo_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'processos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      etapa_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'etapas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      sequencia: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      nome: { type: Sequelize.STRING(150), allowNull: false },
      fase_nome: { type: Sequelize.STRING(150), allowNull: true },
      obrigatoria: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      status: {
        type: Sequelize.ENUM(
          'PENDENTE',
          'EM_ANDAMENTO',
          'CONCLUIDA',
          'BLOQUEADA',
          'PULADA',
        ),
        allowNull: false,
        defaultValue: 'PENDENTE',
      },
      responsavel_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      setor_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'setores', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      prazo_gestao_dias: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      data_inicio: { type: Sequelize.DATE, allowNull: true },
      data_prevista: { type: Sequelize.DATE, allowNull: true },
      data_conclusao: { type: Sequelize.DATE, allowNull: true },
      motivo_bloqueio: { type: Sequelize.TEXT, allowNull: true },
      ...timestamps,
    });
    await queryInterface.addIndex('processo_etapas', ['processo_id', 'sequencia'], {
      unique: true,
      name: 'uq_processo_etapas_processo_sequencia',
    });
    await queryInterface.addIndex('processo_etapas', ['status'], {
      name: 'ix_processo_etapas_status',
    });
    await queryInterface.addIndex('processo_etapas', ['responsavel_id'], {
      name: 'ix_processo_etapas_responsavel_id',
    });
    await queryInterface.addIndex('processo_etapas', ['setor_id'], {
      name: 'ix_processo_etapas_setor_id',
    });

    await queryInterface.createTable('movimentacoes', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      processo_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'processos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      processo_etapa_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'processo_etapas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      usuario_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      setor_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'setores', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      tipo: {
        type: Sequelize.ENUM(
          'CRIACAO',
          'INICIO_ETAPA',
          'CONCLUSAO_ETAPA',
          'ENCAMINHAMENTO',
          'DEVOLUCAO',
          'ALTERACAO',
          'SUSPENSAO',
          'RETOMADA',
          'OBSERVACAO',
        ),
        allowNull: false,
      },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      metadados: { type: Sequelize.JSON, allowNull: true },
      correlacao_id: { type: Sequelize.STRING(64), allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
    await queryInterface.addIndex('movimentacoes', ['processo_id'], {
      name: 'ix_movimentacoes_processo_id',
    });
    await queryInterface.addIndex('movimentacoes', ['processo_etapa_id'], {
      name: 'ix_movimentacoes_processo_etapa_id',
    });
    await queryInterface.addIndex('movimentacoes', ['tipo'], {
      name: 'ix_movimentacoes_tipo',
    });
    await queryInterface.addIndex('movimentacoes', ['created_at'], {
      name: 'ix_movimentacoes_created_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('movimentacoes');
    await queryInterface.dropTable('processo_etapas');
    await queryInterface.dropTable('processos');
  },
};
