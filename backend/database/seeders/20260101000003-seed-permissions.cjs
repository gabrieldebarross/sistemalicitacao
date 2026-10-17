'use strict';

/** Catálogo de permissões. A concessão a papéis é feita separadamente. */
const PERMISSIONS = [
  ['processos.read', 'Visualizar processos'],
  ['processos.create', 'Criar processos'],
  ['processos.update', 'Editar processos'],
  ['processos.cancel', 'Anular ou revogar processos'],
  ['processos.advance', 'Avançar etapas do processo'],
  ['processos.return', 'Devolver etapas do processo'],
  ['processos.assign', 'Atribuir responsáveis'],
  ['processos.suspend', 'Suspender processos'],
  ['processos.resume', 'Retomar processos suspensos'],
  ['processos.supervise', 'Supervisionar processos'],
  ['processos.export', 'Exportar dados de processos'],
  ['fluxos.read', 'Visualizar fluxos de trabalho'],
  ['fluxos.create', 'Criar fluxos de trabalho'],
  ['fluxos.update', 'Editar fluxos de trabalho'],
  ['fluxos.publish', 'Publicar versões de fluxo'],
  ['usuarios.read', 'Visualizar usuários'],
  ['usuarios.create', 'Criar usuários'],
  ['usuarios.update', 'Editar usuários'],
  ['usuarios.deactivate', 'Desativar usuários'],
  ['roles.read', 'Visualizar papéis'],
  ['roles.manage', 'Gerenciar papéis e atribuições'],
  ['permissions.manage', 'Gerenciar permissões'],
  ['audit.read', 'Consultar trilha de auditoria'],
  ['reports.read', 'Visualizar relatórios'],
  ['reports.export', 'Exportar relatórios'],
];

/** Seeder idempotente do catálogo de permissões. */
module.exports = {
  async up(queryInterface) {
    const existentes = await queryInterface.sequelize.query(
      'SELECT codigo FROM permissions',
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    const conhecidos = new Set(existentes.map((r) => r.codigo));
    const now = new Date();
    const novos = PERMISSIONS.filter(([codigo]) => !conhecidos.has(codigo)).map(
      ([codigo, descricao]) => ({
        codigo,
        descricao,
        created_at: now,
        updated_at: now,
      }),
    );
    if (novos.length > 0) {
      await queryInterface.bulkInsert('permissions', novos);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('permissions', {
      codigo: PERMISSIONS.map(([codigo]) => codigo),
    });
  },
};
