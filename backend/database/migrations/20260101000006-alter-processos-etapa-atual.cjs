'use strict';

/**
 * Adiciona a etapa atual do processo. Feito em migration separada para
 * resolver a referência circular entre `processos` e `processo_etapas`.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('processos', 'processo_etapa_atual_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
    });
    await queryInterface.addConstraint('processos', {
      fields: ['processo_etapa_atual_id'],
      type: 'foreign key',
      name: 'fk_processos_processo_etapa_atual',
      references: { table: 'processo_etapas', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('processos', ['processo_etapa_atual_id'], {
      name: 'ix_processos_processo_etapa_atual_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeConstraint(
      'processos',
      'fk_processos_processo_etapa_atual',
    );
    await queryInterface.removeIndex(
      'processos',
      'ix_processos_processo_etapa_atual_id',
    );
    await queryInterface.removeColumn('processos', 'processo_etapa_atual_id');
  },
};
