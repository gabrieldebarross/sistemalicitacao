'use strict';

/** Histórico de hashes de senhas para impedir reutilização recente. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('senhas_historico', {
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
      senha_hash: { type: Sequelize.STRING(255), allowNull: false },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex(
      'senhas_historico',
      ['usuario_id', 'created_at'],
      { name: 'ix_senhas_historico_usuario_created' },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('senhas_historico');
  },
};
