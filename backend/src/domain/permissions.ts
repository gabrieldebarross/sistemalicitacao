/**
 * Catálogo de permissões. É a fonte de verdade usada pelos middlewares de
 * autorização e deve permanecer alinhado ao seeder de permissões.
 */
export const PERMISSIONS = {
  PROCESSOS_READ: 'processos.read',
  PROCESSOS_CREATE: 'processos.create',
  PROCESSOS_UPDATE: 'processos.update',
  PROCESSOS_CANCEL: 'processos.cancel',
  PROCESSOS_ADVANCE: 'processos.advance',
  PROCESSOS_CONCLUDE: 'processos.conclude',
  PROCESSOS_RETURN: 'processos.return',
  PROCESSOS_ASSIGN: 'processos.assign',
  PROCESSOS_SUSPEND: 'processos.suspend',
  PROCESSOS_RESUME: 'processos.resume',
  PROCESSOS_BLOCK: 'processos.block',
  PROCESSOS_UNBLOCK: 'processos.unblock',
  PROCESSOS_SKIP: 'processos.skip',
  FLUXOS_READ: 'fluxos.read',
  FLUXOS_CREATE: 'fluxos.create',
  FLUXOS_UPDATE: 'fluxos.update',
  FLUXOS_PUBLISH: 'fluxos.publish',
  FLUXOS_CLONE: 'fluxos.clone',
  FLUXOS_ARCHIVE: 'fluxos.archive',
  FLUXOS_ASSIGN: 'fluxos.assign',
  SETORES_MANAGE: 'setores.manage',
  CARGOS_MANAGE: 'cargos.manage',
  TIPOS_PROCESSO_MANAGE: 'tipos-processo.manage',
  USUARIOS_READ: 'usuarios.read',
  USUARIOS_CREATE: 'usuarios.create',
  USUARIOS_UPDATE: 'usuarios.update',
  USUARIOS_DEACTIVATE: 'usuarios.deactivate',
  ROLES_READ: 'roles.read',
  ROLES_MANAGE: 'roles.manage',
  PERMISSIONS_MANAGE: 'permissions.manage',
  AUDIT_READ: 'audit.read',
  REPORTS_READ: 'reports.read',
} as const;

export type PermissionCode =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: readonly PermissionCode[] =
  Object.values(PERMISSIONS);
