'use strict';

/**
 * Novos eventos de workflow: bloqueio, desbloqueio e pulo de etapa.
 */
const TIPOS_ANTERIORES = [
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
];

const TIPOS_NOVOS = [
  ...TIPOS_ANTERIORES,
  'BLOQUEIO',
  'DESBLOQUEIO',
  'PULO_ETAPA',
];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('movimentacoes', 'tipo', {
      type: Sequelize.ENUM(...TIPOS_NOVOS),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Converte os novos tipos antes de removê-los do ENUM, permitindo rollback
    // mesmo que já existam registros de bloqueio/desbloqueio/pulo.
    await queryInterface.sequelize.query(
      "UPDATE movimentacoes SET tipo = 'ALTERACAO' WHERE tipo IN ('BLOQUEIO', 'DESBLOQUEIO', 'PULO_ETAPA')",
    );
    await queryInterface.changeColumn('movimentacoes', 'tipo', {
      type: Sequelize.ENUM(...TIPOS_ANTERIORES),
      allowNull: false,
    });
  },
};
