/**
 * Política de autorização RBAC. Centraliza a decisão; nenhum controller ou
 * rota deve verificar papéis diretamente.
 *
 * Princípio: negar por padrão. Só há acesso quando uma permissão explícita é
 * concedida ao usuário (via papéis).
 */
import type { PermissionCode } from './permissions.js';

export interface SujeitoAutorizavel {
  usuarioId: number;
  ativo: boolean;
  permissoes: ReadonlySet<string>;
}

export function possuiPermissao(
  sujeito: SujeitoAutorizavel,
  permissao: PermissionCode,
): boolean {
  if (!sujeito.ativo) {
    return false;
  }
  return sujeito.permissoes.has(permissao);
}

export function possuiAlgumaPermissao(
  sujeito: SujeitoAutorizavel,
  permissoes: readonly PermissionCode[],
): boolean {
  if (!sujeito.ativo) {
    return false;
  }
  return permissoes.some((permissao) => sujeito.permissoes.has(permissao));
}

/**
 * Resolve o papel principal exibido ao usuário. O papel principal é apenas
 * identidade visual: todos os papéis atribuídos continuam valendo para RBAC.
 */
export function resolverPapelPrincipalId(
  roleIds: readonly number[],
  papelPrincipalSolicitado: number | null | undefined,
  papelPrincipalAtual: number | null,
): number | null {
  const principalPreservado =
    papelPrincipalAtual !== null && roleIds.includes(papelPrincipalAtual)
      ? papelPrincipalAtual
      : null;
  return (
    papelPrincipalSolicitado ?? principalPreservado ?? roleIds[0] ?? null
  );
}
