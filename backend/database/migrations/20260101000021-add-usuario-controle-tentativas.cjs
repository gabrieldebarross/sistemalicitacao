'use strict';

/** Controle de tentativas de login e bloqueio temporário por usuário. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'tentativas_falhas', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('usuarios', 'bloqueado_ate', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('usuarios', 'bloqueado_ate');
    await queryInterface.removeColumn('usuarios', 'tentativas_falhas');
  },
};
