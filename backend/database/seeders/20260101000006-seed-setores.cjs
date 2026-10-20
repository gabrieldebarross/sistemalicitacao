'use strict';

/**
 * Setores padrão da estrutura administrativa.
 *
 * São dados ORGANIZACIONAIS, editáveis pela administração — não decorrem da
 * Lei nº 14.133/2021. Ajuste os nomes/siglas conforme a estrutura real do
 * órgão antes de usar em produção.
 */
const SETORES = [
  ['Setor de Licitações e Contratos', 'SLC'],
  ['Departamento de Compras', 'DCOM'],
  ['Assessoria Jurídica', 'AJU'],
  ['Controladoria Interna', 'CIN'],
  ['Setor de Contabilidade', 'SCON'],
  ['Gabinete da Presidência', 'GAB'],
  ['Setor de Recursos Humanos', 'SRH'],
  ['Setor de Tecnologia da Informação', 'STI'],
];

/** Seeder idempotente de setores. */
module.exports = {
  async up(queryInterface) {
    const existentes = await queryInterface.sequelize.query(
      'SELECT nome, sigla FROM setores',
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    const nomes = new Set(existentes.map((r) => r.nome));
    const siglas = new Set(existentes.map((r) => r.sigla).filter(Boolean));
    const now = new Date();
    const novos = SETORES.filter(
      ([nome, sigla]) => !nomes.has(nome) && !siglas.has(sigla),
    ).map(([nome, sigla]) => ({
      nome,
      sigla,
      ativo: true,
      created_at: now,
      updated_at: now,
    }));
    if (novos.length > 0) {
      await queryInterface.bulkInsert('setores', novos);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('setores', {
      nome: SETORES.map(([nome]) => nome),
    });
  },
};
