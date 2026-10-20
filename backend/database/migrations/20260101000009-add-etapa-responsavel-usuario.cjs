'use strict';

/**
 * Permite atribuir uma etapa do fluxo a um usuário específico. A atribuição é
 * copiada como snapshot ao criar o processo (processo_etapas.responsavel_id).
 * A coluna é opcional para preservar fluxos existentes.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('etapas', 'responsavel_usuario_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
      references: { model: 'usuarios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('etapas', ['responsavel_usuario_id'], {
      name: 'ix_etapas_responsavel_usuario_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'etapas',
      'ix_etapas_responsavel_usuario_id',
    );
    await queryInterface.removeColumn('etapas', 'responsavel_usuario_id');
  },
};
