'use strict';

/**
 * Guarda o hash do refresh token imediatamente anterior por uma janela curta.
 * Permite que duas requisições concorrentes legítimas (ex.: duas abas) rotacionem
 * sem que a segunda seja interpretada como reutilização maliciosa. Fora da
 * janela, a reutilização de token antigo continua revogando a sessão.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('sessoes', 'refresh_token_anterior_hash', {
      type: Sequelize.CHAR(64),
      allowNull: true,
      after: 'refresh_token_hash',
    });
    await queryInterface.addColumn('sessoes', 'refresh_rotacionado_em', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'refresh_token_anterior_hash',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('sessoes', 'refresh_rotacionado_em');
    await queryInterface.removeColumn('sessoes', 'refresh_token_anterior_hash');
  },
};
