'use strict';

/**
 * Papel principal do usuário.
 *
 * O papel principal é apenas a identidade exibida no cabeçalho e no perfil.
 * Todos os papéis atribuídos continuam valendo para autorização RBAC.
 *
 * O backfill usa o vínculo de papel mais antigo de cada usuário para evitar
 * cabeçalho sem papel após a migration. A administração pode alterar depois.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'papel_principal_id', {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
    });
    await queryInterface.addConstraint('usuarios', {
      fields: ['papel_principal_id'],
      type: 'foreign key',
      name: 'fk_usuarios_papel_principal',
      references: { table: 'roles', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('usuarios', ['papel_principal_id'], {
      name: 'ix_usuarios_papel_principal_id',
    });

    await queryInterface.sequelize.query(`
      UPDATE usuarios u
      INNER JOIN (
        SELECT usuario_id, MIN(id) AS vinculo_id
        FROM user_roles
        GROUP BY usuario_id
      ) primeiro ON primeiro.usuario_id = u.id
      INNER JOIN user_roles ur ON ur.id = primeiro.vinculo_id
      SET u.papel_principal_id = ur.role_id
      WHERE u.papel_principal_id IS NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'usuarios',
      'ix_usuarios_papel_principal_id',
    );
    await queryInterface.removeConstraint(
      'usuarios',
      'fk_usuarios_papel_principal',
    );
    await queryInterface.removeColumn('usuarios', 'papel_principal_id');
  },
};
