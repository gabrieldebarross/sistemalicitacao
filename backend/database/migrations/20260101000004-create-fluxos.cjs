'use strict';

/**
 * Fluxos de trabalho versionados: fluxo (versão) -> fases -> etapas.
 *
 * Cada tipo de processo pode ter múltiplas versões de fluxo. Processos
 * guardam a referência da versão utilizada, preservando o histórico.
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

    await queryInterface.createTable('fluxos', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      tipo_processo_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'tipos_processo', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      nome: { type: Sequelize.STRING(150), allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      versao: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },
      situacao: {
        type: Sequelize.ENUM('RASCUNHO', 'PUBLICADO', 'ARQUIVADO'),
        allowNull: false,
        defaultValue: 'RASCUNHO',
      },
      publicado_em: { type: Sequelize.DATE, allowNull: true },
      publicado_por_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      ...timestamps,
    });
    await queryInterface.addIndex(
      'fluxos',
      ['tipo_processo_id', 'nome', 'versao'],
      { unique: true, name: 'uq_fluxos_tipo_nome_versao' },
    );
    await queryInterface.addIndex('fluxos', ['tipo_processo_id'], {
      name: 'ix_fluxos_tipo_processo_id',
    });
    await queryInterface.addIndex('fluxos', ['situacao'], {
      name: 'ix_fluxos_situacao',
    });

    await queryInterface.createTable('fases', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      fluxo_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'fluxos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nome: { type: Sequelize.STRING(150), allowNull: false },
      ordem: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      ...timestamps,
    });
    await queryInterface.addIndex('fases', ['fluxo_id', 'ordem'], {
      unique: true,
      name: 'uq_fases_fluxo_ordem',
    });

    await queryInterface.createTable('etapas', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      fase_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'fases', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nome: { type: Sequelize.STRING(150), allowNull: false },
      ordem: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      obrigatoria: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      prazo_gestao_dias: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      responsavel_setor_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'setores', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      responsavel_cargo_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'cargos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      requisitos: { type: Sequelize.TEXT, allowNull: true },
      referencia_legal: { type: Sequelize.STRING(255), allowNull: true },
      condicional: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      condicao_aplicabilidade: { type: Sequelize.TEXT, allowNull: true },
      ...timestamps,
    });
    await queryInterface.addIndex('etapas', ['fase_id', 'ordem'], {
      unique: true,
      name: 'uq_etapas_fase_ordem',
    });
    await queryInterface.addIndex('etapas', ['responsavel_setor_id'], {
      name: 'ix_etapas_responsavel_setor_id',
    });
    await queryInterface.addIndex('etapas', ['responsavel_cargo_id'], {
      name: 'ix_etapas_responsavel_cargo_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('etapas');
    await queryInterface.dropTable('fases');
    await queryInterface.dropTable('fluxos');
  },
};
