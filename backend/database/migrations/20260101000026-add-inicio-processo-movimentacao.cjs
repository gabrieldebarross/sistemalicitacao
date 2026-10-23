'use strict';

/**
 * Separa o início do processo do início de etapa no histórico de
 * movimentações. Registros antigos criados pelo início do processo usavam
 * INICIO_ETAPA com a descrição "Processo iniciado."; eles são reclassificados
 * para INICIO_PROCESSO antes que o novo tipo passe a ser usado.
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
  'BLOQUEIO',
  'DESBLOQUEIO',
  'PULO_ETAPA',
];

const TIPOS_NOVOS = [
  'CRIACAO',
  'INICIO_PROCESSO',
  'INICIO_ETAPA',
  'CONCLUSAO_ETAPA',
  'CONCLUSAO_PROCESSO',
  'ENCAMINHAMENTO',
  'DEVOLUCAO',
  'ALTERACAO',
  'SUSPENSAO',
  'RETOMADA',
  'OBSERVACAO',
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
    await queryInterface.sequelize.query(
      "UPDATE movimentacoes SET tipo = 'INICIO_PROCESSO' WHERE tipo = 'INICIO_ETAPA' AND descricao = 'Processo iniciado.'",
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "UPDATE movimentacoes SET tipo = 'INICIO_ETAPA' WHERE tipo = 'INICIO_PROCESSO'",
    );
    await queryInterface.changeColumn('movimentacoes', 'tipo', {
      type: Sequelize.ENUM(...TIPOS_ANTERIORES),
      allowNull: false,
    });
  },
};
