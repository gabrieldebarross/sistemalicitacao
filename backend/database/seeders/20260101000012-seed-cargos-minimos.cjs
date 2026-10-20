'use strict';

/**
 * Reduz os cargos (e os papéis homônimos) ao conjunto mínimo definido pela
 * administração. Mantém apenas:
 *   Advogado, Agente Administrativo, Assessor Jurídico, Assistente
 *   Administrativo, Contador, Coordenador, Diretor Administrativo Financeiro,
 *   Diretor Serviços Saúde e Supervisor(a) Administrativo.
 * (O papel "Administrador" não é um cargo e não é afetado.)
 *
 * Idempotente: não faz nada se os cargos/papéis já não existirem. As permissões
 * vinculadas aos papéis removidos são excluídas em cascata.
 */
const REMOVIDOS = [
  ['Técnico em Enfermagem', 'TÉCNICO EM EFERMAGEM'],
  ['Farmacêutico Bioquímico/Biomédico', 'FARMACÊUTICO BIOQUIMICO/BIOMÉDICO'],
  ['Técnico em Análises Clínicas', 'TÉCNICO EM ANÁLISES CLÍNICAS'],
  ['Estagiário(a) Setor de Enfermagem', 'ESTAGIÁRIO (A) SETOR DE ENFERMAGEM'],
  ['Estagiário(a) Laboratório', 'ESTAGIÁRIO (A) LABORATÓRIO'],
  ['Enfermeiro', 'ENFERMEIRO'],
  ['Técnico em Raio-X', 'TÉCNICO EM RAIO-X'],
  ['Técnico em Informática', 'TÉCNICO EM INFORMÁTICA'],
  ['Auxiliar de Serviços Gerais', 'AUXILIAR DE SERVIÇOS GERAIS'],
  ['Psicólogo', 'PSICOLOGO'],
];

module.exports = {
  async up(queryInterface) {
    const nomes = REMOVIDOS.map(([nome]) => nome);
    // Papéis homônimos (role_permissions/user_roles caem em cascata).
    await queryInterface.bulkDelete('roles', { nome: nomes });
    await queryInterface.bulkDelete('cargos', { nome: nomes });
  },

  async down(queryInterface) {
    const now = new Date();
    const sequelize = queryInterface.sequelize;
    const { QueryTypes } = sequelize;

    const cargos = await sequelize.query('SELECT nome FROM cargos', {
      type: QueryTypes.SELECT,
    });
    const conhecidos = new Set(cargos.map((c) => c.nome));
    const novosCargos = REMOVIDOS.filter(([nome]) => !conhecidos.has(nome)).map(
      ([nome, original]) => ({
        nome,
        nome_original: original,
        created_at: now,
        updated_at: now,
      }),
    );
    if (novosCargos.length > 0) {
      await queryInterface.bulkInsert('cargos', novosCargos);
    }

    const roles = await sequelize.query('SELECT nome FROM roles', {
      type: QueryTypes.SELECT,
    });
    const rolesConhecidos = new Set(roles.map((r) => r.nome));
    const novosRoles = REMOVIDOS.filter(
      ([nome]) => !rolesConhecidos.has(nome),
    ).map(([nome]) => ({
      nome,
      descricao: `Perfil de acesso do cargo "${nome}".`,
      created_at: now,
      updated_at: now,
    }));
    if (novosRoles.length > 0) {
      await queryInterface.bulkInsert('roles', novosRoles);
    }
  },
};
