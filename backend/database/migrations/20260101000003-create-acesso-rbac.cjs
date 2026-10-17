'use strict';

/**
 * Acesso e autorização (RBAC): usuários, papéis, permissões e vínculos.
 *
 * Papéis representam cargos (ADR 0002) e recebem permissões explícitas. A
 * matriz papel x permissão deve ser definida pela administração; por padrão
 * (negar por padrão) nenhuma permissão é concedida pelo seeder.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const timestamps = {
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    };

    await queryInterface.createTable('usuarios', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      nome: { type: Sequelize.STRING(150), allowNull: false },
      email: { type: Sequelize.STRING(180), allowNull: false },
      senha_hash: { type: Sequelize.STRING(255), allowNull: false },
      cargo_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'cargos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      ativo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      ultimo_acesso_em: { type: Sequelize.DATE, allowNull: true },
      ...timestamps,
    });
    await queryInterface.addIndex('usuarios', ['email'], {
      unique: true,
      name: 'uq_usuarios_email',
    });
    await queryInterface.addIndex('usuarios', ['cargo_id'], {
      name: 'ix_usuarios_cargo_id',
    });
    await queryInterface.addIndex('usuarios', ['ativo'], {
      name: 'ix_usuarios_ativo',
    });

    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      nome: { type: Sequelize.STRING(150), allowNull: false },
      descricao: { type: Sequelize.STRING(255), allowNull: true },
      ...timestamps,
    });
    await queryInterface.addIndex('roles', ['nome'], {
      unique: true,
      name: 'uq_roles_nome',
    });

    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      codigo: { type: Sequelize.STRING(100), allowNull: false },
      descricao: { type: Sequelize.STRING(255), allowNull: true },
      ...timestamps,
    });
    await queryInterface.addIndex('permissions', ['codigo'], {
      unique: true,
      name: 'uq_permissions_codigo',
    });

    await queryInterface.createTable('user_roles', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      usuario_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      atribuido_por_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      atribuido_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      ...timestamps,
    });
    await queryInterface.addIndex('user_roles', ['usuario_id', 'role_id'], {
      unique: true,
      name: 'uq_user_roles_usuario_role',
    });
    await queryInterface.addIndex('user_roles', ['role_id'], {
      name: 'ix_user_roles_role_id',
    });

    await queryInterface.createTable('role_permissions', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      role_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      permission_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'permissions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      ...timestamps,
    });
    await queryInterface.addIndex(
      'role_permissions',
      ['role_id', 'permission_id'],
      { unique: true, name: 'uq_role_permissions_role_permission' },
    );
    await queryInterface.addIndex('role_permissions', ['permission_id'], {
      name: 'ix_role_permissions_permission_id',
    });

    await queryInterface.createTable('user_sector_assignments', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      usuario_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      setor_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'setores', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      principal: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      ...timestamps,
    });
    await queryInterface.addIndex(
      'user_sector_assignments',
      ['usuario_id', 'setor_id'],
      { unique: true, name: 'uq_user_sector_assignments_usuario_setor' },
    );
    await queryInterface.addIndex('user_sector_assignments', ['setor_id'], {
      name: 'ix_user_sector_assignments_setor_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_sector_assignments');
    await queryInterface.dropTable('role_permissions');
    await queryInterface.dropTable('user_roles');
    await queryInterface.dropTable('permissions');
    await queryInterface.dropTable('roles');
    await queryInterface.dropTable('usuarios');
  },
};
