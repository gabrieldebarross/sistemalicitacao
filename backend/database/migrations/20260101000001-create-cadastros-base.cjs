'use strict';

/**
 * Cadastros base: cargos e setores.
 *
 * Cargos armazenam apenas o nome (normalizado) e o valor original para
 * rastreabilidade (ADR 0004). Os campos numéricos foram removidos do projeto.
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

    await queryInterface.createTable('cargos', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      nome: { type: Sequelize.STRING(150), allowNull: false },
      nome_original: { type: Sequelize.STRING(200), allowNull: true },
      ...timestamps,
    });
    await queryInterface.addIndex('cargos', ['nome'], {
      unique: true,
      name: 'uq_cargos_nome',
    });

    await queryInterface.createTable('setores', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      nome: { type: Sequelize.STRING(150), allowNull: false },
      sigla: { type: Sequelize.STRING(30), allowNull: true },
      ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      ...timestamps,
    });
    await queryInterface.addIndex('setores', ['nome'], {
      unique: true,
      name: 'uq_setores_nome',
    });
    await queryInterface.addIndex('setores', ['sigla'], {
      unique: true,
      name: 'uq_setores_sigla',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('setores');
    await queryInterface.dropTable('cargos');
  },
};
