/** Contexto de execução de um caso de uso (derivado do token e da requisição). */
export interface ContextoRequisicao {
  usuarioId: number | null;
  requestId: string;
  ip: string | null;
  userAgent: string | null;
  permissoes: ReadonlySet<string>;
}
