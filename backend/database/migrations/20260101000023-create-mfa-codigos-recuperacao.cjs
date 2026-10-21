'use strict';

/** Códigos de recuperação de MFA, de uso único, armazenados como hash. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mfa_codigos_recuperacao', {
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
      codigo_hash: { type: Sequelize.CHAR(64), allowNull: false },
      usado_em: { type: Sequelize.DATE, allowNull: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex(
      'mfa_codigos_recuperacao',
      ['usuario_id', 'usado_em'],
      { name: 'ix_mfa_codigos_usuario_usado' },
    );
    await queryInterface.addIndex(
      'mfa_codigos_recuperacao',
      ['usuario_id', 'codigo_hash'],
      { name: 'ux_mfa_codigos_usuario_hash', unique: true },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('mfa_codigos_recuperacao');
  },
};
