'use strict';

const bcrypt = require('bcrypt');

/**
 * Bootstrap do administrador inicial.
 *
 * Só executa quando ADMIN_EMAIL e ADMIN_PASSWORD estão definidos no ambiente.
 * Sem essas variáveis, nenhuma concessão é feita (negar por padrão). O papel
 * "Administrador" recebe todas as permissões do catálogo e o usuário informado
 * é criado com senha em hash (bcrypt) e vinculado a esse papel.
 */
const ROLE_ADMIN = 'Administrador';

module.exports = {
  async up(queryInterface) {
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const senha = process.env.ADMIN_PASSWORD || '';
    const nome = (process.env.ADMIN_NOME || 'Administrador do Sistema').trim();

    if (!email || !senha) {
      console.warn(
        '[seed:admin] ADMIN_EMAIL/ADMIN_PASSWORD ausentes; bootstrap ignorado.',
      );
      return;
    }
    if (senha.length < 8) {
      throw new Error('ADMIN_PASSWORD deve ter ao menos 8 caracteres.');
    }

    const now = new Date();

    // Papel administrador
    let [role] = await queryInterface.sequelize.query(
      'SELECT id FROM roles WHERE nome = ? LIMIT 1',
      {
        replacements: [ROLE_ADMIN],
        type: queryInterface.sequelize.QueryTypes.SELECT,
      },
    );
    if (!role) {
      await queryInterface.bulkInsert('roles', [
        {
          nome: ROLE_ADMIN,
          descricao: 'Acesso administrativo completo',
          created_at: now,
          updated_at: now,
        },
      ]);
      [role] = await queryInterface.sequelize.query(
        'SELECT id FROM roles WHERE nome = ? LIMIT 1',
        {
          replacements: [ROLE_ADMIN],
          type: queryInterface.sequelize.QueryTypes.SELECT,
        },
      );
    }

    // Concede todas as permissões ao papel administrador
    const permissions = await queryInterface.sequelize.query(
      'SELECT id FROM permissions',
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    const jaConcedidas = await queryInterface.sequelize.query(
      'SELECT permission_id FROM role_permissions WHERE role_id = ?',
      {
        replacements: [role.id],
        type: queryInterface.sequelize.QueryTypes.SELECT,
      },
    );
    const concedidas = new Set(jaConcedidas.map((r) => r.permission_id));
    const novas = permissions
      .filter((p) => !concedidas.has(p.id))
      .map((p) => ({
        role_id: role.id,
        permission_id: p.id,
        created_at: now,
        updated_at: now,
      }));
    if (novas.length > 0) {
      await queryInterface.bulkInsert('role_permissions', novas);
    }

    // Usuário administrador
    let [usuario] = await queryInterface.sequelize.query(
      'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
      {
        replacements: [email],
        type: queryInterface.sequelize.QueryTypes.SELECT,
      },
    );
    if (!usuario) {
      const senhaHash = bcrypt.hashSync(senha, 12);
      await queryInterface.bulkInsert('usuarios', [
        {
          nome,
          email,
          senha_hash: senhaHash,
          cargo_id: null,
          ativo: true,
          created_at: now,
          updated_at: now,
        },
      ]);
      [usuario] = await queryInterface.sequelize.query(
        'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
        {
          replacements: [email],
          type: queryInterface.sequelize.QueryTypes.SELECT,
        },
      );
    }

    const vinculos = await queryInterface.sequelize.query(
      'SELECT id FROM user_roles WHERE usuario_id = ? AND role_id = ?',
      {
        replacements: [usuario.id, role.id],
        type: queryInterface.sequelize.QueryTypes.SELECT,
      },
    );
    if (vinculos.length === 0) {
      await queryInterface.bulkInsert('user_roles', [
        {
          usuario_id: usuario.id,
          role_id: role.id,
          atribuido_por_id: null,
          atribuido_em: now,
          created_at: now,
          updated_at: now,
        },
      ]);
    }
  },

  async down(queryInterface) {
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (email) {
      const usuarios = await queryInterface.sequelize.query(
        'SELECT id FROM usuarios WHERE email = ?',
        {
          replacements: [email],
          type: queryInterface.sequelize.QueryTypes.SELECT,
        },
      );
      for (const usuario of usuarios) {
        await queryInterface.bulkDelete('user_roles', {
          usuario_id: usuario.id,
        });
      }
      await queryInterface.bulkDelete('usuarios', { email });
    }
    const roles = await queryInterface.sequelize.query(
      'SELECT id FROM roles WHERE nome = ?',
      {
        replacements: [ROLE_ADMIN],
        type: queryInterface.sequelize.QueryTypes.SELECT,
      },
    );
    for (const role of roles) {
      await queryInterface.bulkDelete('role_permissions', {
        role_id: role.id,
      });
    }
    await queryInterface.bulkDelete('roles', { nome: ROLE_ADMIN });
  },
};
