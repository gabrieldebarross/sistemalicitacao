'use strict';

/**
 * Fluxo PADRÃO por tipo de processo, com fases e etapas baseadas apenas no
 * texto da Lei nº 14.133/2021 (texto oficial).
 *
 * - Modalidades de licitação: fases do art. 17; etapas citando art. 18, 53, 54,
 *   71 e o próprio art. 17.
 * - Contratação direta (dispensa/inexigibilidade): instrução do art. 72.
 *
 * Cada fluxo é criado PUBLICADO e é EDITÁVEL/CLONÁVEL: a administração pode
 * criar fluxos personalizados. Prazos de gestão ficam nulos (a lei fixa prazos
 * legais, não prazos internos de gestão) e o responsável por setor/cargo não é
 * definido (decisão administrativa, não decorre da lei).
 *
 * Seeder idempotente: não recria o fluxo padrão se ele já existir para o tipo.
 */
const NOME_PADRAO = 'Fluxo padrão (Lei nº 14.133/2021)';

const LICITACAO = [
  {
    nome: 'Preparatória',
    descricao:
      'Planejamento da contratação. Lei nº 14.133/2021, art. 17, I e art. 18.',
    etapas: [
      [
        'Estudo técnico preliminar (ETP)',
        'Lei nº 14.133/2021, art. 18, I',
      ],
      [
        'Definição do objeto (termo de referência, anteprojeto ou projeto)',
        'Lei nº 14.133/2021, art. 18, II',
      ],
      ['Orçamento estimado', 'Lei nº 14.133/2021, art. 18, IV'],
      ['Elaboração do edital de licitação', 'Lei nº 14.133/2021, art. 18, V'],
      ['Análise de riscos', 'Lei nº 14.133/2021, art. 18, X'],
      [
        'Parecer jurídico / controle prévio de legalidade',
        'Lei nº 14.133/2021, art. 53',
      ],
    ],
  },
  {
    nome: 'Divulgação do edital',
    descricao: 'Publicidade do ato convocatório. Lei nº 14.133/2021, art. 54.',
    etapas: [
      [
        'Publicação do edital no Portal Nacional de Contratações Públicas (PNCP)',
        'Lei nº 14.133/2021, art. 17, II e art. 54',
      ],
    ],
  },
  {
    nome: 'Apresentação de propostas e lances',
    descricao:
      'Quando for o caso. Lei nº 14.133/2021, art. 17, III e § 2º.',
    etapas: [
      [
        'Sessão pública de apresentação de propostas e lances',
        'Lei nº 14.133/2021, art. 17, III e § 2º',
      ],
    ],
  },
  {
    nome: 'Julgamento',
    descricao: 'Julgamento das propostas. Lei nº 14.133/2021, art. 17, IV.',
    etapas: [
      [
        'Julgamento das propostas',
        'Lei nº 14.133/2021, art. 17, IV',
      ],
    ],
  },
  {
    nome: 'Habilitação',
    descricao:
      'Habilitação dos licitantes. Lei nº 14.133/2021, art. 17, V (pode anteceder as fases previstas no § 1º do art. 17, se no edital).',
    etapas: [
      [
        'Habilitação dos licitantes',
        'Lei nº 14.133/2021, art. 17, V',
      ],
    ],
  },
  {
    nome: 'Recursal',
    descricao:
      'Recursos administrativos. Lei nº 14.133/2021, art. 17, VI.',
    etapas: [
      [
        'Fase recursal',
        'Lei nº 14.133/2021, art. 17, VI',
      ],
    ],
  },
  {
    nome: 'Homologação',
    descricao:
      'Encerramento. Lei nº 14.133/2021, art. 17, VII e art. 71.',
    etapas: [
      [
        'Adjudicação do objeto e homologação da licitação',
        'Lei nº 14.133/2021, art. 17, VII e art. 71, IV',
      ],
    ],
  },
];

const CONTRATACAO_DIRETA = [
  {
    nome: 'Instrução do processo',
    descricao:
      'Instrução do processo de contratação direta. Lei nº 14.133/2021, art. 72.',
    etapas: [
      [
        'Documento de formalização da demanda (ETP, TR, projeto básico ou executivo)',
        'Lei nº 14.133/2021, art. 72, I',
      ],
      ['Estimativa de despesa', 'Lei nº 14.133/2021, art. 72, II'],
      [
        'Parecer jurídico e pareceres técnicos',
        'Lei nº 14.133/2021, art. 72, III',
      ],
      [
        'Demonstração de compatibilidade orçamentária',
        'Lei nº 14.133/2021, art. 72, IV',
      ],
      [
        'Comprovação de habilitação e qualificação do contratado',
        'Lei nº 14.133/2021, art. 72, V',
      ],
      [
        'Razão da escolha do contratado',
        'Lei nº 14.133/2021, art. 72, VI',
      ],
      [
        'Justificativa de preço',
        'Lei nº 14.133/2021, art. 72, VII',
      ],
      [
        'Autorização da autoridade competente',
        'Lei nº 14.133/2021, art. 72, VIII',
      ],
    ],
  },
  {
    nome: 'Divulgação',
    descricao:
      'Divulgação do ato de autorização. Lei nº 14.133/2021, art. 72, parágrafo único.',
    etapas: [
      [
        'Divulgação do ato de autorização/extrato',
        'Lei nº 14.133/2021, art. 72, parágrafo único',
      ],
    ],
  },
];

const MODALIDADES_LICITACAO = [
  'Pregão Eletrônico',
  'Concorrência',
  'Concurso',
  'Leilão',
  'Diálogo Competitivo',
];

const MODALIDADES_DIRETA = [
  'Dispensa de Licitação',
  'Inexigibilidade de Licitação',
];

async function criarFluxo(queryInterface, tipo, estrutura) {
  const sequelize = queryInterface.sequelize;
  const { QueryTypes } = sequelize;
  const now = new Date();

  const jaExiste = await sequelize.query(
    'SELECT id FROM fluxos WHERE tipo_processo_id = ? AND nome = ? LIMIT 1',
    {
      type: QueryTypes.SELECT,
      replacements: [tipo.id, NOME_PADRAO],
    },
  );
  if (jaExiste.length > 0) {
    return false;
  }

  const versoes = await sequelize.query(
    'SELECT COALESCE(MAX(versao), 0) AS ultima FROM fluxos WHERE tipo_processo_id = ?',
    { type: QueryTypes.SELECT, replacements: [tipo.id] },
  );
  const proximaVersao = Number(versoes[0].ultima) + 1;

  await sequelize.query(
    "UPDATE fluxos SET situacao = 'ARQUIVADO', updated_at = ? WHERE tipo_processo_id = ? AND situacao = 'PUBLICADO'",
    { replacements: [now, tipo.id] },
  );

  await queryInterface.bulkInsert('fluxos', [
    {
      tipo_processo_id: tipo.id,
      nome: NOME_PADRAO,
      descricao:
        'Fluxo padrão baseado na Lei nº 14.133/2021. Editável: a administração pode criar fluxos personalizados.',
      versao: proximaVersao,
      situacao: 'PUBLICADO',
      publicado_em: now,
      publicado_por_id: null,
      created_at: now,
      updated_at: now,
    },
  ]);

  const fluxo = await sequelize.query(
    'SELECT id FROM fluxos WHERE tipo_processo_id = ? AND nome = ? ORDER BY id DESC LIMIT 1',
    { type: QueryTypes.SELECT, replacements: [tipo.id, NOME_PADRAO] },
  );
  const fluxoId = fluxo[0].id;

  for (let i = 0; i < estrutura.length; i += 1) {
    const fase = estrutura[i];
    await queryInterface.bulkInsert('fases', [
      {
        fluxo_id: fluxoId,
        nome: fase.nome,
        ordem: i + 1,
        descricao: fase.descricao,
        created_at: now,
        updated_at: now,
      },
    ]);

    const faseId = (
      await sequelize.query(
        'SELECT id FROM fases WHERE fluxo_id = ? AND ordem = ? LIMIT 1',
        { type: QueryTypes.SELECT, replacements: [fluxoId, i + 1] },
      )
    )[0].id;

    const etapas = fase.etapas.map(([nome, referencia], j) => ({
      fase_id: faseId,
      nome,
      ordem: j + 1,
      obrigatoria: true,
      prazo_gestao_dias: null,
      responsavel_setor_id: null,
      responsavel_cargo_id: null,
      descricao: null,
      requisitos: null,
      referencia_legal: referencia,
      condicional: false,
      condicao_aplicabilidade: null,
      created_at: now,
      updated_at: now,
    }));
    await queryInterface.bulkInsert('etapas', etapas);
  }

  return true;
}

module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const { QueryTypes } = sequelize;
    const tipos = await sequelize.query(
      'SELECT id, nome FROM tipos_processo',
      { type: QueryTypes.SELECT },
    );
    const porNome = new Map(tipos.map((t) => [t.nome, t]));

    let criados = 0;
    for (const nome of MODALIDADES_LICITACAO) {
      const tipo = porNome.get(nome);
      if (tipo && (await criarFluxo(queryInterface, tipo, LICITACAO))) {
        criados += 1;
      }
    }
    for (const nome of MODALIDADES_DIRETA) {
      const tipo = porNome.get(nome);
      if (tipo && (await criarFluxo(queryInterface, tipo, CONTRATACAO_DIRETA))) {
        criados += 1;
      }
    }
    if (criados === 0) {
      // Nenhum fluxo novo: seed idempotente já aplicado.
    }
  },

  async down(queryInterface) {
    // Remove o fluxo padrão e, em cascata, suas fases e etapas.
    await queryInterface.bulkDelete('fluxos', { nome: NOME_PADRAO });
  },
};
