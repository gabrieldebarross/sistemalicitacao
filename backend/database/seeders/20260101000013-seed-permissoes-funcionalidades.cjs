'use strict';

/**
 * Novas permissões por funcionalidade e ajuste da matriz de papéis.
 *
 * - Separa cadastros (setores/cargos/tipos) da edição de fluxos.
 * - Separa conclusão de processo do avanço de etapas.
 * - Cria permissões específicas para clonar, arquivar e atribuir etapas de fluxo.
 * - Remove `reports.export` (não existe exportação implementada).
 *
 * Idempotente: pode ser executado novamente sem duplicar concessões.
 */
const PERMISSOES = [
  ['processos.conclude', 'Concluir processos'],
  ['fluxos.clone', 'Clonar fluxos de trabalho'],
  ['fluxos.archive', 'Arquivar fluxos de trabalho'],
  ['fluxos.assign', 'Atribuir responsável a etapas do fluxo'],
  ['setores.manage', 'Gerenciar setores'],
  ['cargos.manage', 'Gerenciar cargos'],
  ['tipos-processo.manage', 'Gerenciar tipos de processo'],
];

const NOVAS_POR_PAPEL = {
  Administrador: PERMISSOES.map(([codigo]) => codigo),
  'Diretor Administrativo Financeiro': [
    'processos.conclude',
    'fluxos.clone',
    'fluxos.archive',
    'fluxos.assign',
    'setores.manage',
    'cargos.manage',
    'tipos-processo.manage',
  ],
  'Diretor Serviços Saúde': ['processos.conclude'],
  Coordenador: ['processos.conclude', 'fluxos.assign'],
  'Supervisor(a) Administrativo': ['processos.conclude'],
  'Agente Administrativo': ['processos.conclude'],
};

module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const { QueryTypes } = sequelize;
    const now = new Date();

    // 1. Catálogo: insere permissões que ainda não existem.
    const existentes = await sequelize.query(
      'SELECT id, codigo FROM permissions',
      { type: QueryTypes.SELECT },
    );
    const conhecidas = new Set(existentes.map((linha) => linha.codigo));
    const novas = PERMISSOES.filter(([codigo]) => !conhecidas.has(codigo)).map(
      ([codigo, descricao]) => ({
        codigo,
        descricao,
        created_at: now,
        updated_at: now,
      }),
    );
    if (novas.length > 0) {
      await queryInterface.bulkInsert('permissions', novas);
    }

    await queryInterface.sequelize.query(
      "UPDATE permissions SET descricao = 'Visualizar painel e indicadores gerenciais', updated_at = ? WHERE codigo = 'reports.read'",
      { replacements: [now] },
    );

    // 2. Remove permissões sem funcionalidade implementada (código morto).
    const obsoletas = [
      'reports.export',
      'processos.supervise',
      'processos.export',
    ];
    await sequelize.query(
      `DELETE rp FROM role_permissions rp
         JOIN permissions p ON p.id = rp.permission_id
        WHERE p.codigo IN (?)`,
      { replacements: [obsoletas] },
    );
    await queryInterface.bulkDelete('permissions', { codigo: obsoletas });

    // 3. Concede as novas permissões aos papéis indicados.
    const permissoes = await sequelize.query(
      'SELECT id, codigo FROM permissions WHERE codigo IN (?)',
      {
        type: QueryTypes.SELECT,
        replacements: [PERMISSOES.map(([codigo]) => codigo)],
      },
    );
    const idPorCodigo = new Map(
      permissoes.map((linha) => [linha.codigo, linha.id]),
    );

    let concedidas = 0;
    for (const [nomePapel, codigos] of Object.entries(NOVAS_POR_PAPEL)) {
      const roles = await sequelize.query(
        'SELECT id FROM roles WHERE nome = ? LIMIT 1',
        { type: QueryTypes.SELECT, replacements: [nomePapel] },
      );
      if (roles.length === 0) {
        continue; // Papel não existe; nada a fazer.
      }
      const roleId = roles[0].id;
      const vinculos = await sequelize.query(
        'SELECT permission_id FROM role_permissions WHERE role_id = ?',
        { type: QueryTypes.SELECT, replacements: [roleId] },
      );
      const jaTem = new Set(vinculos.map((linha) => linha.permission_id));
      const inserir = codigos
        .map((codigo) => idPorCodigo.get(codigo))
        .filter((id) => id !== undefined && !jaTem.has(id))
        .map((id) => ({
          role_id: roleId,
          permission_id: id,
          created_at: now,
          updated_at: now,
        }));
      if (inserir.length > 0) {
        await queryInterface.bulkInsert('role_permissions', inserir);
        concedidas += inserir.length;
      }
    }

    console.log(
      `[seed:permissoes-funcionalidades] ${novas.length} permissões criadas, ${concedidas} concessões aplicadas.`,
    );
  },

  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const codigos = PERMISSOES.map(([codigo]) => codigo);
    await sequelize.query(
      `DELETE rp FROM role_permissions rp
         JOIN permissions p ON p.id = rp.permission_id
        WHERE p.codigo IN (?)`,
      { replacements: [codigos] },
    );
    await queryInterface.bulkDelete('permissions', { codigo: codigos });
  },
};
