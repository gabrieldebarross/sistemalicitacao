'use strict';

/** Configuração de MFA TOTP por usuário. O segredo é armazenado cifrado. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'mfa_segredo_criptografado', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('usuarios', 'mfa_ativo', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('usuarios', 'mfa_configurado_em', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('usuarios', 'mfa_resetado_em', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('usuarios', 'mfa_resetado_em');
    await queryInterface.removeColumn('usuarios', 'mfa_configurado_em');
    await queryInterface.removeColumn('usuarios', 'mfa_ativo');
    await queryInterface.removeColumn('usuarios', 'mfa_segredo_criptografado');
  },
};
