'use strict';

/**
 * Separa a conclusão do processo da conclusão de etapa no histórico de
 * movimentações. A alteração é aditiva ao ENUM existente.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('movimentacoes', 'tipo', {
      type: Sequelize.ENUM(
        'CRIACAO',
        'INICIO_ETAPA',
        'CONCLUSAO_ETAPA',
        'CONCLUSAO_PROCESSO',
        'ENCAMINHAMENTO',
        'DEVOLUCAO',
        'ALTERACAO',
        'SUSPENSAO',
        'RETOMADA',
        'OBSERVACAO',
      ),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Converte os registros antes de remover o valor do ENUM, para que o
    // rollback não falhe por dados existentes.
    await queryInterface.sequelize.query(
      "UPDATE movimentacoes SET tipo = 'CONCLUSAO_ETAPA' WHERE tipo = 'CONCLUSAO_PROCESSO'",
    );
    await queryInterface.changeColumn('movimentacoes', 'tipo', {
      type: Sequelize.ENUM(
        'CRIACAO',
        'INICIO_ETAPA',
        'CONCLUSAO_ETAPA',
        'ENCAMINHAMENTO',
        'DEVOLUCAO',
        'ALTERACAO',
        'SUSPENSAO',
        'RETOMADA',
        'OBSERVACAO',
      ),
      allowNull: false,
    });
  },
};
