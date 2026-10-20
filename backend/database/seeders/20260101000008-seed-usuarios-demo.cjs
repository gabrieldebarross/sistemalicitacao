'use strict';

const bcrypt = require('bcrypt');

/**
 * Usuário de exemplo (demonstração), criado a partir de variáveis de ambiente.
 *
 * Só executa quando SEED_DEMO_EMAIL e SEED_DEMO_PASSWORD estão definidos. Nunca
 * há senha no código. Opcionalmente vincula um cargo (SEED_DEMO_CARGO) e um
 * papel (SEED_DEMO_ROLE), ambos por nome. Idempotente: não recria se o e-mail
 * já existir.
 */
module.exports = {
  async up(queryInterface) {
    const email = (process.env.SEED_DEMO_EMAIL || '').trim().toLowerCase();
    const senha = process.env.SEED_DEMO_PASSWORD || '';
    const nome = (process.env.SEED_DEMO_NOME || 'Usuário de Exemplo').trim();

    if (!email || !senha) {
      console.warn(
        '[seed:demo-users] SEED_DEMO_EMAIL/SEED_DEMO_PASSWORD ausentes; ignorado.',
      );
      return;
    }
    if (senha.length < 8) {
      throw new Error('SEED_DEMO_PASSWORD deve ter ao menos 8 caracteres.');
    }

    const now = new Date();
    const existente = await queryInterface.sequelize.query(
      'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
      {
        replacements: [email],
        type: queryInterface.sequelize.QueryTypes.SELECT,
      },
    );
    if (existente.length > 0) {
      return;
    }

    let cargoId = null;
    const cargoNome = (process.env.SEED_DEMO_CARGO || '').trim();
    if (cargoNome) {
      const cargos = await queryInterface.sequelize.query(
        'SELECT id FROM cargos WHERE nome = ? LIMIT 1',
        {
          replacements: [cargoNome],
          type: queryInterface.sequelize.QueryTypes.SELECT,
        },
      );
      cargoId = cargos.length > 0 ? cargos[0].id : null;
    }

    await queryInterface.bulkInsert('usuarios', [
      {
        nome,
        email,
        senha_hash: bcrypt.hashSync(senha, 12),
        cargo_id: cargoId,
        ativo: true,
        created_at: now,
        updated_at: now,
      },
    ]);

    const roleNome = (process.env.SEED_DEMO_ROLE || '').trim();
    if (roleNome) {
      const usuarios = await queryInterface.sequelize.query(
        'SELECT id FROM usuarios WHERE email = ? LIMIT 1',
        {
          replacements: [email],
          type: queryInterface.sequelize.QueryTypes.SELECT,
        },
      );
      const roles = await queryInterface.sequelize.query(
        'SELECT id FROM roles WHERE nome = ? LIMIT 1',
        {
          replacements: [roleNome],
          type: queryInterface.sequelize.QueryTypes.SELECT,
        },
      );
      if (usuarios.length > 0 && roles.length > 0) {
        await queryInterface.bulkInsert('user_roles', [
          {
            usuario_id: usuarios[0].id,
            role_id: roles[0].id,
            atribuido_por_id: null,
            atribuido_em: now,
            created_at: now,
            updated_at: now,
          },
        ]);
      }
    }
  },

  async down(queryInterface) {
    const email = (process.env.SEED_DEMO_EMAIL || '').trim().toLowerCase();
    if (!email) {
      return;
    }
    const usuarios = await queryInterface.sequelize.query(
      'SELECT id FROM usuarios WHERE email = ?',
      {
        replacements: [email],
        type: queryInterface.sequelize.QueryTypes.SELECT,
      },
    );
    for (const usuario of usuarios) {
      await queryInterface.bulkDelete('user_roles', { usuario_id: usuario.id });
    }
    await queryInterface.bulkDelete('usuarios', { email });
  },
};
