'use strict';

/** Visões salvas de filtros de processos, privadas por usuário. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('visoes_salvas', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      usuario_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nome: { type: Sequelize.STRING(80), allowNull: false },
      filtros: { type: Sequelize.JSON, allowNull: false },
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

    await queryInterface.addIndex('visoes_salvas', ['usuario_id'], {
      name: 'ix_visoes_salvas_usuario_id',
    });
    await queryInterface.addIndex('visoes_salvas', ['usuario_id', 'nome'], {
      name: 'ux_visoes_salvas_usuario_nome',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('visoes_salvas');
  },
};
