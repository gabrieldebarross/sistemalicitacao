'use strict';

/**
 * Papéis padrão derivados dos cargos existentes (ADR 0002). Nenhuma permissão
 * é concedida aqui: negar por padrão até a administração definir a matriz.
 */
module.exports = {
  async up(queryInterface) {
    const cargos = await queryInterface.sequelize.query(
      'SELECT nome FROM cargos',
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    const roles = await queryInterface.sequelize.query(
      'SELECT nome FROM roles',
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    const conhecidos = new Set(roles.map((r) => r.nome));
    const now = new Date();
    const novos = cargos
      .filter((c) => !conhecidos.has(c.nome))
      .map((c) => ({
        nome: c.nome,
        descricao: `Papel padrão do cargo ${c.nome}`,
        created_at: now,
        updated_at: now,
      }));
    if (novos.length > 0) {
      await queryInterface.bulkInsert('roles', novos);
    }
  },

  async down(queryInterface) {
    const cargos = await queryInterface.sequelize.query(
      'SELECT nome FROM cargos',
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );
    if (cargos.length > 0) {
      await queryInterface.bulkDelete('roles', {
        nome: cargos.map((c) => c.nome),
      });
    }
  },
};
