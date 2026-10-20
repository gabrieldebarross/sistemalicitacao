'use strict';

/**
 * Ajusta a descrição dos papéis derivados de cargos (ADR 0002) para um texto
 * mais claro. Não altera papéis criados pela administração nem descrições já
 * personalizadas: só atualiza o padrão anterior
 * ("Papel padrão do cargo ...").
 *
 * As permissões de cada papel são definidas pela administração na tela de
 * papéis (negar por padrão).
 */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const { QueryTypes } = sequelize;
    const roles = await sequelize.query(
      "SELECT id, nome, descricao FROM roles WHERE descricao LIKE 'Papel padrão do cargo %'",
      { type: QueryTypes.SELECT },
    );
    const now = new Date();
    for (const role of roles) {
      await sequelize.query(
        'UPDATE roles SET descricao = ?, updated_at = ? WHERE id = ?',
        {
          replacements: [
            `Perfil de acesso do cargo "${role.nome}". As permissões são concedidas pela administração na tela de papéis.`,
            now,
            role.id,
          ],
        },
      );
    }
  },

  async down(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const now = new Date();
    await sequelize.query(
      "UPDATE roles SET descricao = CONCAT('Papel padrão do cargo ', nome), updated_at = ? WHERE descricao LIKE 'Perfil de acesso do cargo %'",
      { replacements: [now] },
    );
  },
};
