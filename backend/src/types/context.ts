/** Contexto de execução de um caso de uso (derivado do token e da requisição). */
export interface ContextoRequisicao {
  usuarioId: number | null;
  requestId: string;
  ip: string | null;
  userAgent: string | null;
  permissoes: ReadonlySet<string>;
  /**
   * Falhas de login já registradas para o IP antes da requisição atual.
   * Usado apenas para avisos genéricos de bloqueio, sem revelar se o usuário
   * existe.
   */
  tentativasLoginIp?: number;
}
