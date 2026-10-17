'use strict';

/**
 * Tipos de processo: modalidades do art. 28 e hipóteses de contratação direta.
 * Base legal conforme Lei nº 14.133/2021.
 */
const TIPOS = [
  [
    'Pregão Eletrônico',
    'Modalidade obrigatória para aquisição de bens e serviços comuns, em forma eletrônica.',
    'Lei nº 14.133/2021, art. 28, I e art. 29',
  ],
  [
    'Concorrência',
    'Modalidade para contratação de bens e serviços especiais e de obras e serviços comuns de engenharia.',
    'Lei nº 14.133/2021, art. 28, II e art. 29',
  ],
  [
    'Concurso',
    'Modalidade para escolha de trabalho técnico, científico ou artístico.',
    'Lei nº 14.133/2021, art. 28, III e art. 30',
  ],
  [
    'Leilão',
    'Modalidade para alienação de bens imóveis ou de móveis inservíveis ou legalmente apreendidos.',
    'Lei nº 14.133/2021, art. 28, IV e art. 31',
  ],
  [
    'Diálogo Competitivo',
    'Modalidade para contratação de objeto de inovação tecnológica ou técnica de difícil definição.',
    'Lei nº 14.133/2021, art. 28, V e art. 32',
  ],
  [
    'Dispensa de Licitação',
    'Hipótese de contratação direta nas situações previstas em lei.',
    'Lei nº 14.133/2021, art. 75',
  ],
  [
    'Inexigibilidade de Licitação',
    'Hipótese de contratação direta quando houver inviabilidade de competição.',
    'Lei nº 14.133/2021, art. 74',
  ],
];

/** Seeder idempotente de tipos de processo. */
module.exports = {
  async up(queryInterface) {
    const existentes = await queryInterface.sequelize.query(
      'SELECT nome FROM tipos_processo',
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    const conhecidos = new Set(existentes.map((r) => r.nome));
    const now = new Date();
    const novos = TIPOS.filter(([nome]) => !conhecidos.has(nome)).map(
      ([nome, descricao, base_legal]) => ({
        nome,
        descricao,
        base_legal,
        ativo: true,
        created_at: now,
        updated_at: now,
      }),
    );
    if (novos.length > 0) {
      await queryInterface.bulkInsert('tipos_processo', novos);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('tipos_processo', {
      nome: TIPOS.map(([nome]) => nome),
    });
  },
};
