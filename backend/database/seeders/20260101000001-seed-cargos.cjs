'use strict';

const CARGOS = [
  ['Advogado', 'Advogado'],
  ['Agente Administrativo', 'AGENTE ADMINISTRATIVO'],
  ['Assessor Jurídico', 'ASSESSOR JURÍDICO'],
  ['Assistente Administrativo', 'ASSISTENTE ADMINISTRATIVO'],
  ['Contador', 'CONTADOR'],
  ['Coordenador', 'COORDENADOR'],
  ['Diretor Administrativo Financeiro', 'DIRETOR ADMINISTRATIVO FINANCEIRO'],
  ['Diretor Serviços Saúde', 'DIRETOR SERVIÇOS SAÚDE'],
  ['Supervisor(a) Administrativo', 'SUPERVISOR(A) ADMINISTRATIVO'],
];

/** Seeder idempotente de cargos (nome normalizado + nome original). */
module.exports = {
  async up(queryInterface) {
    const existentes = await queryInterface.sequelize.query(
      'SELECT nome FROM cargos',
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    const conhecidos = new Set(existentes.map((r) => r.nome));
    const now = new Date();
    const novos = CARGOS.filter(([nome]) => !conhecidos.has(nome)).map(
      ([nome, original]) => ({
        nome,
        nome_original: original,
        created_at: now,
        updated_at: now,
      }),
    );
    if (novos.length > 0) {
      await queryInterface.bulkInsert('cargos', novos);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('cargos', {
      nome: CARGOS.map(([nome]) => nome),
    });
  },
};
