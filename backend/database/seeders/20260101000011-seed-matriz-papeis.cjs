'use strict';

/**
 * Matriz inicial papel × permissão para os papéis derivados de cargos
 * (ADR 0002). É uma PROPOSTA TÉCNICA baseada em menor privilégio, separação de
 * funções e na natureza de cada cargo — NÃO é declaração de competência legal.
 *
 * Regras:
 * - Não altera o papel `Administrador` (administração técnica, via bootstrap).
 * - Aditivo e idempotente: garante as permissões listadas sem remover eventuais
 *   concessões feitas depois pela administração.
 * - Cargos de apoio/sem atuação em contratações ficam sem permissão (negar por
 *   padrão).
 *
 * `down` remove apenas as concessões listadas aqui.
 */
const P = {
  PROCESSOS_READ: 'processos.read',
  PROCESSOS_CREATE: 'processos.create',
  PROCESSOS_UPDATE: 'processos.update',
  PROCESSOS_CANCEL: 'processos.cancel',
  PROCESSOS_ADVANCE: 'processos.advance',
  PROCESSOS_CONCLUDE: 'processos.conclude',
  PROCESSOS_RETURN: 'processos.return',
  PROCESSOS_ASSIGN: 'processos.assign',
  PROCESSOS_SUSPEND: 'processos.suspend',
  PROCESSOS_RESUME: 'processos.resume',
  FLUXOS_READ: 'fluxos.read',
  FLUXOS_CREATE: 'fluxos.create',
  FLUXOS_UPDATE: 'fluxos.update',
  FLUXOS_PUBLISH: 'fluxos.publish',
  FLUXOS_CLONE: 'fluxos.clone',
  FLUXOS_ARCHIVE: 'fluxos.archive',
  FLUXOS_ASSIGN: 'fluxos.assign',
  SETORES_MANAGE: 'setores.manage',
  CARGOS_MANAGE: 'cargos.manage',
  TIPOS_PROCESSO_MANAGE: 'tipos-processo.manage',
  USUARIOS_READ: 'usuarios.read',
  ROLES_READ: 'roles.read',
  AUDIT_READ: 'audit.read',
  REPORTS_READ: 'reports.read',
};

const OPERACAO = [
  P.PROCESSOS_READ,
  P.PROCESSOS_CREATE,
  P.PROCESSOS_UPDATE,
  P.PROCESSOS_ADVANCE,
  P.PROCESSOS_CONCLUDE,
  P.PROCESSOS_RETURN,
  P.PROCESSOS_ASSIGN,
  P.FLUXOS_READ,
];

const MATRIZ = {
  // Gestão administrativo-financeira: supervisão e configuração de fluxos.
  'Diretor Administrativo Financeiro': [
    ...OPERACAO,
    P.PROCESSOS_CANCEL,
    P.PROCESSOS_SUSPEND,
    P.PROCESSOS_RESUME,
    P.FLUXOS_CREATE,
    P.FLUXOS_UPDATE,
    P.FLUXOS_PUBLISH,
    P.FLUXOS_CLONE,
    P.FLUXOS_ARCHIVE,
    P.FLUXOS_ASSIGN,
    P.SETORES_MANAGE,
    P.CARGOS_MANAGE,
    P.TIPOS_PROCESSO_MANAGE,
    P.USUARIOS_READ,
    P.ROLES_READ,
    P.AUDIT_READ,
    P.REPORTS_READ,
  ],
  // Gestão da área finalística: supervisão dos processos da saúde.
  'Diretor Serviços Saúde': [
    ...OPERACAO,
    P.PROCESSOS_SUSPEND,
    P.PROCESSOS_RESUME,
    P.REPORTS_READ,
  ],
  // Coordenação: operação + supervisão.
  Coordenador: [
    ...OPERACAO,
    P.PROCESSOS_SUSPEND,
    P.PROCESSOS_RESUME,
    P.FLUXOS_ASSIGN,
    P.REPORTS_READ,
  ],
  // Supervisão operacional: opera e atribui, sem suspender/anular.
  'Supervisor(a) Administrativo': [...OPERACAO, P.REPORTS_READ],
  // Operação: cria, tramita e conclui etapas.
  'Agente Administrativo': OPERACAO,
  // Apoio operacional: tramita etapas existentes, sem criar processos.
  'Assistente Administrativo': [
    P.PROCESSOS_READ,
    P.PROCESSOS_UPDATE,
    P.PROCESSOS_ADVANCE,
    P.PROCESSOS_RETURN,
    P.FLUXOS_READ,
  ],
  // Parecerista jurídico: analisa e devolve; não cria nem anula.
  Advogado: [
    P.PROCESSOS_READ,
    P.PROCESSOS_ADVANCE,
    P.PROCESSOS_RETURN,
    P.FLUXOS_READ,
    P.REPORTS_READ,
  ],
  'Assessor Jurídico': [
    P.PROCESSOS_READ,
    P.PROCESSOS_ADVANCE,
    P.PROCESSOS_RETURN,
    P.FLUXOS_READ,
    P.REPORTS_READ,
  ],
  // Orçamentário/contábil: consulta e relatórios.
  Contador: [P.PROCESSOS_READ, P.REPORTS_READ],
};

async function buscarIdsPermissoes(sequelize, QueryTypes, codigos) {
  if (codigos.length === 0) {
    return [];
  }
  const rows = await sequelize.query(
    'SELECT id, codigo FROM permissions WHERE codigo IN (?)',
    { type: QueryTypes.SELECT, replacements: [codigos] },
  );
  const desconhecidas = codigos.filter(
    (codigo) => !rows.some((r) => r.codigo === codigo),
  );
  if (desconhecidas.length > 0) {
    throw new Error(
      `Permissões inexistentes na matriz: ${desconhecidas.join(', ')}`,
    );
  }
  return rows;
}

module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const { QueryTypes } = sequelize;
    const now = new Date();
    let concedidas = 0;

    for (const [nomePapel, codigos] of Object.entries(MATRIZ)) {
      const roles = await sequelize.query(
        'SELECT id FROM roles WHERE nome = ? LIMIT 1',
        { type: QueryTypes.SELECT, replacements: [nomePapel] },
      );
      if (roles.length === 0) {
        continue; // Papel não existe (cargo removido); ignora.
      }
      const roleId = roles[0].id;
      const permissoes = await buscarIdsPermissoes(
        sequelize,
        QueryTypes,
        codigos,
      );
      const existentes = await sequelize.query(
        'SELECT permission_id FROM role_permissions WHERE role_id = ?',
        { type: QueryTypes.SELECT, replacements: [roleId] },
      );
      const jaTem = new Set(existentes.map((r) => r.permission_id));
      const novas = permissoes
        .filter((permissao) => !jaTem.has(permissao.id))
        .map((permissao) => ({
          role_id: roleId,
          permission_id: permissao.id,
          created_at: now,
          updated_at: now,
        }));
      if (novas.length > 0) {
        await queryInterface.bulkInsert('role_permissions', novas);
        concedidas += novas.length;
      }
    }

    if (concedidas > 0) {
      console.log(
        `[seed:matriz-papeis] ${concedidas} concessões aplicadas à matriz inicial.`,
      );
    }
  },

  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;

    for (const [nomePapel, codigos] of Object.entries(MATRIZ)) {
      if (codigos.length === 0) {
        continue;
      }
      await sequelize.query(
        `DELETE rp FROM role_permissions rp
           JOIN roles r ON r.id = rp.role_id
           JOIN permissions p ON p.id = rp.permission_id
          WHERE r.nome = ? AND p.codigo IN (?)`,
        { replacements: [nomePapel, codigos] },
      );
    }
  },
};
