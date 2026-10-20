'use strict';

/**
 * Adiciona o nome do processo, mantendo `numero` como identificador
 * administrativo. Processos existentes recebem o número como nome inicial.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('processos', 'nome', {
      type: Sequelize.STRING(150),
      allowNull: true,
      after: 'numero',
    });
    await queryInterface.sequelize.query(
      'UPDATE processos SET nome = numero WHERE nome IS NULL OR nome = ""',
    );
    await queryInterface.changeColumn('processos', 'nome', {
      type: Sequelize.STRING(150),
      allowNull: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('processos', 'nome');
  },
};
