'use strict';

/**
 * Trilha de auditoria (imutável). Registra usuário, ação, recurso, resultado,
 * justificativa e identificador de correlação. Nunca deve conter segredos.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('auditoria', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      usuario_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      acao: { type: Sequelize.STRING(100), allowNull: false },
      recurso: { type: Sequelize.STRING(100), allowNull: true },
      recurso_id: { type: Sequelize.STRING(64), allowNull: true },
      resultado: {
        type: Sequelize.ENUM('SUCESSO', 'FALHA'),
        allowNull: false,
        defaultValue: 'SUCESSO',
      },
      justificativa: { type: Sequelize.TEXT, allowNull: true },
      correlacao_id: { type: Sequelize.STRING(64), allowNull: true },
      ip: { type: Sequelize.STRING(45), allowNull: true },
      metadados: { type: Sequelize.JSON, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
    await queryInterface.addIndex('auditoria', ['usuario_id'], {
      name: 'ix_auditoria_usuario_id',
    });
    await queryInterface.addIndex('auditoria', ['acao'], {
      name: 'ix_auditoria_acao',
    });
    await queryInterface.addIndex('auditoria', ['recurso'], {
      name: 'ix_auditoria_recurso',
    });
    await queryInterface.addIndex('auditoria', ['created_at'], {
      name: 'ix_auditoria_created_at',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('auditoria');
  },
};
