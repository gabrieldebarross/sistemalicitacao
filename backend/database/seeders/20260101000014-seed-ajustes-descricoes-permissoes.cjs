'use strict';

/**
 * Esclarece o escopo de `permissions.manage`: ele permite atribuir/remover
 * permissões de um papel, em compatibilidade com `roles.manage`. O catálogo de
 * permissões é definido pelo sistema e não é editável pela interface.
 */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.sequelize.query(
      "UPDATE permissions SET descricao = 'Atribuir permissões aos papéis (alias de Papéis)', updated_at = ? WHERE codigo = 'permissions.manage'",
      { replacements: [now] },
    );
    await queryInterface.sequelize.query(
      "UPDATE permissions SET descricao = 'Gerenciar papéis e atribuições de permissões', updated_at = ? WHERE codigo = 'roles.manage'",
      { replacements: [now] },
    );
  },

  async down(queryInterface) {
    const now = new Date();
    await queryInterface.sequelize.query(
      "UPDATE permissions SET descricao = 'Gerenciar permissões', updated_at = ? WHERE codigo = 'permissions.manage'",
      { replacements: [now] },
    );
    await queryInterface.sequelize.query(
      "UPDATE permissions SET descricao = 'Gerenciar papéis e atribuições', updated_at = ? WHERE codigo = 'roles.manage'",
      { replacements: [now] },
    );
  },
};
