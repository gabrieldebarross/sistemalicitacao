'use strict';

/**
 * Índices para o histórico paginado de movimentações por processo.
 * O primeiro atende a ordenação cronológica; o segundo, o filtro por tipo.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex(
      'movimentacoes',
      ['processo_id', 'created_at', 'id'],
      { name: 'ix_movimentacoes_processo_created_id' },
    );
    await queryInterface.addIndex(
      'movimentacoes',
      ['processo_id', 'tipo', 'created_at', 'id'],
      { name: 'ix_movimentacoes_processo_tipo_created_id' },
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'movimentacoes',
      'ix_movimentacoes_processo_tipo_created_id',
    );
    await queryInterface.removeIndex(
      'movimentacoes',
      'ix_movimentacoes_processo_created_id',
    );
  },
};
