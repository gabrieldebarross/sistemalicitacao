'use strict';

/**
 * Permissões da Fase 1 do workflow: bloqueio, desbloqueio e pulo de etapa.
 * Idempotente e aditivo. O catálogo é do sistema; os papéis apenas recebem
 * concessões conforme a matriz inicial.
 */
const PERMISSOES = [
  ['processos.block', 'Bloquear a etapa atual do processo'],
  ['processos.unblock', 'Desbloquear a etapa atual do processo'],
  ['processos.skip', 'Pular etapa do processo com justificativa'],
];

const PAPEIS_COM_CONTROLE_DE_ETAPA = [
  'Administrador',
  'Diretor Administrativo Financeiro',
  'Diretor Serviços Saúde',
  'Coordenador',
  'Supervisor(a) Administrativo',
];

async function idsPermissoes(sequelize, QueryTypes) {
  return sequelize.query(
    'SELECT id, codigo FROM permissions WHERE codigo IN (?)',
    {
      type: QueryTypes.SELECT,
      replacements: [PERMISSOES.map(([codigo]) => codigo)],
    },
  );
}

module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const { QueryTypes } = sequelize;
    const now = new Date();

    const existentes = await sequelize.query(
      'SELECT codigo FROM permissions',
      { type: QueryTypes.SELECT },
    );
    const conhecidas = new Set(existentes.map((item) => item.codigo));
    const novas = PERMISSOES.filter(
      ([codigo]) => !conhecidas.has(codigo),
    ).map(([codigo, descricao]) => ({
      codigo,
      descricao,
      created_at: now,
      updated_at: now,
    }));
    if (novas.length > 0) {
      await queryInterface.bulkInsert('permissions', novas);
    }

    const permissoes = await idsPermissoes(sequelize, QueryTypes);
    const permissionIds = permissoes.map((item) => item.id);

    for (const nomePapel of PAPEIS_COM_CONTROLE_DE_ETAPA) {
      const [papel] = await sequelize.query(
        'SELECT id FROM roles WHERE nome = ? LIMIT 1',
        { type: QueryTypes.SELECT, replacements: [nomePapel] },
      );
      if (!papel) {
        continue;
      }
      const atuais = await sequelize.query(
        'SELECT permission_id FROM role_permissions WHERE role_id = ?',
        { type: QueryTypes.SELECT, replacements: [papel.id] },
      );
      const jaConcedidas = new Set(
        atuais.map((item) => item.permission_id),
      );
      const conceder = permissionIds
        .filter((permissionId) => !jaConcedidas.has(permissionId))
        .map((permissionId) => ({
          role_id: papel.id,
          permission_id: permissionId,
          created_at: now,
          updated_at: now,
        }));
      if (conceder.length > 0) {
        await queryInterface.bulkInsert('role_permissions', conceder);
      }
    }
  },

  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const { QueryTypes } = sequelize;
    const permissoes = await idsPermissoes(sequelize, QueryTypes);
    const permissionIds = permissoes.map((item) => item.id);
    if (permissionIds.length > 0) {
      await sequelize.query(
        'DELETE FROM role_permissions WHERE permission_id IN (?)',
        { replacements: [permissionIds] },
      );
    }
    await queryInterface.bulkDelete('permissions', {
      codigo: PERMISSOES.map(([codigo]) => codigo),
    });
  },
};
