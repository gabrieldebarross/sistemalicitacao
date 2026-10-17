'use strict';

/**
 * Tipos de processo (modalidades e hipóteses de contratação direta).
 * Dados iniciais são inseridos pelo seeder correspondente.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tipos_processo', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      nome: { type: Sequelize.STRING(120), allowNull: false },
      descricao: { type: Sequelize.TEXT, allowNull: true },
      base_legal: { type: Sequelize.STRING(255), allowNull: true },
      ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
    await queryInterface.addIndex('tipos_processo', ['nome'], {
      unique: true,
      name: 'uq_tipos_processo_nome',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tipos_processo');
  },
};
