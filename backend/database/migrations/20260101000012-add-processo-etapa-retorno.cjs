'use strict';

/**
 * Guarda a etapa que originou uma devolução. Quando a etapa devolvida for
 * concluída novamente, o processo retorna para essa origem em vez de seguir
 * linearmente para a próxima etapa.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('processo_etapas', 'retorno_para_etapa_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
    });
    await queryInterface.addConstraint('processo_etapas', {
      fields: ['retorno_para_etapa_id'],
      type: 'foreign key',
      name: 'fk_processo_etapas_retorno_para_etapa',
      references: { table: 'processo_etapas', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex(
      'processo_etapas',
      ['retorno_para_etapa_id'],
      { name: 'ix_processo_etapas_retorno_para_etapa_id' },
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'processo_etapas',
      'ix_processo_etapas_retorno_para_etapa_id',
    );
    await queryInterface.removeConstraint(
      'processo_etapas',
      'fk_processo_etapas_retorno_para_etapa',
    );
    await queryInterface.removeColumn('processo_etapas', 'retorno_para_etapa_id');
  },
};
