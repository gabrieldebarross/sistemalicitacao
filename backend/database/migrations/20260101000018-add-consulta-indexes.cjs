'use strict';

/** Índices compostos para filtros de processos, tarefas e prazos. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('processos', ['status', 'created_at'], {
      name: 'ix_processos_status_created_at',
    });
    await queryInterface.addIndex(
      'processos',
      ['responsavel_atual_id', 'status'],
      { name: 'ix_processos_responsavel_status' },
    );
    await queryInterface.addIndex('processos', ['setor_atual_id', 'status'], {
      name: 'ix_processos_setor_status',
    });
    await queryInterface.addIndex(
      'processo_etapas',
      ['responsavel_id', 'status', 'data_prevista'],
      { name: 'ix_processo_etapas_responsavel_status_prazo' },
    );
    await queryInterface.addIndex(
      'processo_etapas',
      ['setor_id', 'status', 'data_prevista'],
      { name: 'ix_processo_etapas_setor_status_prazo' },
    );
    await queryInterface.addIndex(
      'processo_etapas',
      ['processo_id', 'status'],
      { name: 'ix_processo_etapas_processo_status' },
    );
    await queryInterface.addIndex('processo_etapas', ['etapa_id'], {
      name: 'ix_processo_etapas_etapa_id',
    });
    await queryInterface.addIndex('processo_etapas', ['data_prevista'], {
      name: 'ix_processo_etapas_data_prevista',
    });
  },

  async down(queryInterface) {
    const indices = [
      ['processos', 'ix_processos_status_created_at'],
      ['processos', 'ix_processos_responsavel_status'],
      ['processos', 'ix_processos_setor_status'],
      ['processo_etapas', 'ix_processo_etapas_responsavel_status_prazo'],
      ['processo_etapas', 'ix_processo_etapas_setor_status_prazo'],
      ['processo_etapas', 'ix_processo_etapas_processo_status'],
      ['processo_etapas', 'ix_processo_etapas_etapa_id'],
      ['processo_etapas', 'ix_processo_etapas_data_prevista'],
    ];
    for (const [tabela, nome] of indices) {
      await queryInterface.removeIndex(tabela, nome);
    }
  },
};
