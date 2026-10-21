'use strict';

/**
 * Fase 1 do workflow: configuração de etapa pulável e snapshot dos campos de
 * condicionalidade/pulo na ocorrência da etapa no processo.
 *
 * Os campos de snapshot preservam o comportamento vigente no momento da
 * criação do processo, mesmo que o fluxo seja alterado depois.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('etapas', 'permite_pulo', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('processo_etapas', 'condicional', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn(
      'processo_etapas',
      'condicao_aplicabilidade',
      {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    );
    await queryInterface.addColumn('processo_etapas', 'permite_pulo', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('processo_etapas', 'motivo_pulo', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('processo_etapas', 'pulada_em', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Preserva a configuração dos processos já existentes.
    await queryInterface.sequelize.query(
      `UPDATE processo_etapas pe
         JOIN etapas e ON e.id = pe.etapa_id
          SET pe.condicional = e.condicional,
              pe.condicao_aplicabilidade = e.condicao_aplicabilidade,
              pe.permite_pulo = e.permite_pulo`,
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('processo_etapas', 'pulada_em');
    await queryInterface.removeColumn('processo_etapas', 'motivo_pulo');
    await queryInterface.removeColumn('processo_etapas', 'permite_pulo');
    await queryInterface.removeColumn(
      'processo_etapas',
      'condicao_aplicabilidade',
    );
    await queryInterface.removeColumn('processo_etapas', 'condicional');
    await queryInterface.removeColumn('etapas', 'permite_pulo');
  },
};
