export interface AutenticacaoRequisicao {
  usuarioId: number;
  nome: string;
  email: string;
  senhaProvisoria: boolean;
  permissoes: ReadonlySet<string>;
  roles: string[];
}
