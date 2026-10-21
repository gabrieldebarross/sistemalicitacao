'use strict';

/** Sessões revogáveis. O refresh token é persistido somente como hash. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sessoes', {
      id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
      },
      usuario_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      refresh_token_hash: {
        type: Sequelize.CHAR(64),
        allowNull: true,
      },
      estado: {
        type: Sequelize.ENUM('ATIVA', 'MFA_PENDENTE'),
        allowNull: false,
        defaultValue: 'ATIVA',
      },
      mfa_configuracao_pendente: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      mfa_tentativas: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      expira_em: { type: Sequelize.DATE, allowNull: false },
      revogada_em: { type: Sequelize.DATE, allowNull: true },
      ultimo_uso_em: { type: Sequelize.DATE, allowNull: true },
      ip: { type: Sequelize.STRING(45), allowNull: true },
      user_agent: { type: Sequelize.STRING(255), allowNull: true },
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

    await queryInterface.addIndex('sessoes', ['refresh_token_hash'], {
      name: 'ux_sessoes_refresh_token_hash',
      unique: true,
    });
    await queryInterface.addIndex('sessoes', ['usuario_id', 'estado'], {
      name: 'ix_sessoes_usuario_estado',
    });
    await queryInterface.addIndex('sessoes', ['revogada_em', 'expira_em'], {
      name: 'ix_sessoes_revogada_expira',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('sessoes');
  },
};
