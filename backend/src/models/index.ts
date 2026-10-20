/**
 * Registro central dos modelos Sequelize e definição das associações.
 *
 * Importar este módulo garante que todos os modelos estejam inicializados e
 * associados antes do uso.
 */
import { Auditoria } from './auditoria.js';
import { Cargo } from './cargo.js';
import { Etapa } from './etapa.js';
import { Fase } from './fase.js';
import { Fluxo } from './fluxo.js';
import { Movimentacao } from './movimentacao.js';
import { Permission } from './permission.js';
import { Processo } from './processo.js';
import { ProcessoEtapa } from './processo-etapa.js';
import { Role } from './role.js';
import { RolePermission } from './role-permission.js';
import { Setor } from './setor.js';
import { TipoProcesso } from './tipo-processo.js';
import { Usuario } from './usuario.js';
import { UserRole } from './user-role.js';
import { UserSectorAssignment } from './user-sector-assignment.js';

// Cargo / Usuario
Cargo.hasMany(Usuario, { foreignKey: 'cargoId', as: 'usuarios' });
Usuario.belongsTo(Cargo, { foreignKey: 'cargoId', as: 'cargo' });

// TipoProcesso / Fluxo / Fase / Etapa
TipoProcesso.hasMany(Fluxo, { foreignKey: 'tipoProcessoId', as: 'fluxos' });
Fluxo.belongsTo(TipoProcesso, { foreignKey: 'tipoProcessoId', as: 'tipoProcesso' });

Fluxo.hasMany(Fase, { foreignKey: 'fluxoId', as: 'fases' });
Fase.belongsTo(Fluxo, { foreignKey: 'fluxoId', as: 'fluxo' });

Fase.hasMany(Etapa, { foreignKey: 'faseId', as: 'etapas' });
Etapa.belongsTo(Fase, { foreignKey: 'faseId', as: 'fase' });

Etapa.belongsTo(Setor, {
  foreignKey: 'responsavelSetorId',
  as: 'responsavelSetor',
});
Etapa.belongsTo(Cargo, {
  foreignKey: 'responsavelCargoId',
  as: 'responsavelCargo',
});
Etapa.belongsTo(Usuario, {
  foreignKey: 'responsavelUsuarioId',
  as: 'responsavelUsuario',
});

// Processo
Processo.belongsTo(TipoProcesso, {
  foreignKey: 'tipoProcessoId',
  as: 'tipoProcesso',
});
Processo.belongsTo(Fluxo, { foreignKey: 'fluxoId', as: 'fluxo' });
Processo.belongsTo(Setor, { foreignKey: 'setorAtualId', as: 'setorAtual' });
Processo.belongsTo(Usuario, {
  foreignKey: 'responsavelAtualId',
  as: 'responsavelAtual',
});
Processo.belongsTo(Usuario, { foreignKey: 'criadoPorId', as: 'criadoPor' });

// Processo / ProcessoEtapa
Processo.hasMany(ProcessoEtapa, {
  foreignKey: 'processoId',
  as: 'etapas',
});
ProcessoEtapa.belongsTo(Processo, {
  foreignKey: 'processoId',
  as: 'processo',
});
ProcessoEtapa.belongsTo(Usuario, {
  foreignKey: 'responsavelId',
  as: 'responsavel',
});
ProcessoEtapa.belongsTo(Setor, { foreignKey: 'setorId', as: 'setor' });

Processo.belongsTo(ProcessoEtapa, {
  foreignKey: 'processoEtapaAtualId',
  as: 'etapaAtual',
});

// Movimentacao
Processo.hasMany(Movimentacao, {
  foreignKey: 'processoId',
  as: 'movimentacoes',
});
Movimentacao.belongsTo(Processo, {
  foreignKey: 'processoId',
  as: 'processo',
});
Movimentacao.belongsTo(ProcessoEtapa, {
  foreignKey: 'processoEtapaId',
  as: 'processoEtapa',
});
Movimentacao.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
Movimentacao.belongsTo(Setor, { foreignKey: 'setorId', as: 'setor' });

// RBAC — usuario x role x permission
Usuario.belongsToMany(Role, {
  through: UserRole,
  foreignKey: 'usuarioId',
  otherKey: 'roleId',
  as: 'roles',
});
Role.belongsToMany(Usuario, {
  through: UserRole,
  foreignKey: 'roleId',
  otherKey: 'usuarioId',
  as: 'usuarios',
});
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions',
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles',
});

UserRole.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
UserRole.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// Usuario x Setor
Usuario.belongsToMany(Setor, {
  through: UserSectorAssignment,
  foreignKey: 'usuarioId',
  otherKey: 'setorId',
  as: 'setores',
});
Setor.belongsToMany(Usuario, {
  through: UserSectorAssignment,
  foreignKey: 'setorId',
  otherKey: 'usuarioId',
  as: 'usuarios',
});

// Auditoria
Auditoria.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

export const models = {
  Cargo,
  Setor,
  TipoProcesso,
  Usuario,
  Role,
  Permission,
  UserRole,
  RolePermission,
  UserSectorAssignment,
  Fluxo,
  Fase,
  Etapa,
  Processo,
  ProcessoEtapa,
  Movimentacao,
  Auditoria,
};

export {
  Auditoria,
  Cargo,
  Etapa,
  Fase,
  Fluxo,
  Movimentacao,
  Permission,
  Processo,
  ProcessoEtapa,
  Role,
  RolePermission,
  Setor,
  TipoProcesso,
  Usuario,
  UserRole,
  UserSectorAssignment,
};
