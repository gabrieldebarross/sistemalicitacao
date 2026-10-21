'use strict';

/**
 * Delegação temporária de tarefas. `processo_id` nulo significa delegação
 * global; preenchido limita a delegação àquele processo.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('delegacoes', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      origem_usuario_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      destino_usuario_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      processo_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'processos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      inicio_em: { type: Sequelize.DATE, allowNull: false },
      fim_em: { type: Sequelize.DATE, allowNull: false },
      motivo: { type: Sequelize.STRING(500), allowNull: false },
      cancelado_em: { type: Sequelize.DATE, allowNull: true },
      cancelado_por_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      criado_por_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
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
    });

    await queryInterface.addIndex(
      'delegacoes',
      ['origem_usuario_id', 'inicio_em', 'fim_em'],
      { name: 'ix_delegacoes_origem_periodo' },
    );
    await queryInterface.addIndex(
      'delegacoes',
      ['destino_usuario_id', 'inicio_em', 'fim_em'],
      { name: 'ix_delegacoes_destino_periodo' },
    );
    await queryInterface.addIndex('delegacoes', ['processo_id'], {
      name: 'ix_delegacoes_processo_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('delegacoes');
  },
};
