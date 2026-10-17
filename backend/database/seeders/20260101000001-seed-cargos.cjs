'use strict';

const CARGOS = [
  ['Assistente Administrativo', 'ASSISTENTE ADMINISTRATIVO'],
  ['Técnico em Enfermagem', 'TÉCNICO EM EFERMAGEM'],
  ['Farmacêutico Bioquímico/Biomédico', 'FARMACÊUTICO BIOQUIMICO/BIOMÉDICO'],
  ['Contador', 'CONTADOR'],
  ['Técnico em Análises Clínicas', 'TÉCNICO EM ANÁLISES CLÍNICAS'],
  ['Estagiário(a) Setor de Enfermagem', 'ESTAGIÁRIO (A) SETOR DE ENFERMAGEM'],
  ['Estagiário(a) Laboratório', 'ESTAGIÁRIO (A) LABORATÓRIO'],
  ['Advogado', 'Advogado'],
  ['Enfermeiro', 'ENFERMEIRO'],
  ['Técnico em Raio-X', 'TÉCNICO EM RAIO-X'],
  ['Técnico em Informática', 'TÉCNICO EM INFORMÁTICA'],
  ['Agente Administrativo', 'AGENTE ADMINISTRATIVO'],
  ['Auxiliar de Serviços Gerais', 'AUXILIAR DE SERVIÇOS GERAIS'],
  ['Psicólogo', 'PSICOLOGO'],
  ['Coordenador', 'COORDENADOR'],
  ['Assessor Jurídico', 'ASSESSOR JURÍDICO'],
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
