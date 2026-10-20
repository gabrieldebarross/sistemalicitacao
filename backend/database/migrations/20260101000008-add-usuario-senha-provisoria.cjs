'use strict';

/**
 * Senha provisória: usuários criados pela administração recebem senha
 * provisória e são obrigados a trocá-la no primeiro acesso. Usuários já
 * existentes (inclusive o administrador bootstrap) não são afetados
 * (default false).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'senha_provisoria', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('usuarios', 'senha_provisoria');
  },
};
