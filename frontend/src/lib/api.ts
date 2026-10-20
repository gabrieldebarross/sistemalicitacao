/**
 * Cliente HTTP da API. Usa cookies HttpOnly (sessão) e o token CSRF em cookie
 * legível, enviado no header `x-csrf-token` em requisições que alteram estado.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

/**
 * Limite máximo de itens por página aceito pela API (`MAX_PAGE_SIZE` no
 * backend). Requisições acima desse valor retornam 400.
 */
export const TAMANHO_PAGINA_MAX = 100;

export interface Paginacao {
  total: number;
  pagina: number;
  tamanhoPagina: number;
  totalPaginas: number;
}

export interface Resposta<T> {
  sucesso: true;
  dados: T;
  paginacao?: Paginacao;
}

export class ApiError extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly detalhes: Record<string, string[]> | undefined;

  constructor(
    message: string,
    status: number,
    codigo: string,
    detalhes?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

function lerCookie(nome: string): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }
  const alvo = `${nome}=`;
  const partes = document.cookie.split(';');
  for (const parte of partes) {
    const valor = parte.trim();
    if (valor.startsWith(alvo)) {
      return decodeURIComponent(valor.slice(alvo.length));
    }
  }
  return undefined;
}

async function requisitar<T>(
  metodo: string,
  caminho: string,
  corpo?: unknown,
): Promise<Resposta<T>> {
  const headers: Record<string, string> = {};
  if (corpo !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (metodo !== 'GET') {
    const csrf = lerCookie('sl_csrf');
    if (csrf) {
      headers['x-csrf-token'] = csrf;
    }
  }

  const resposta = await fetch(`${API_URL}${caminho}`, {
    method: metodo,
    headers,
    credentials: 'include',
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });

  const texto = await resposta.text();
  const json = texto ? (JSON.parse(texto) as Record<string, unknown>) : {};

  if (!resposta.ok || json.sucesso === false) {
    const mensagem =
      typeof json.mensagem === 'string'
        ? json.mensagem
        : 'Não foi possível concluir a operação.';
    const codigo = typeof json.codigo === 'string' ? json.codigo : 'ERRO';
    const detalhes = json.detalhes as Record<string, string[]> | undefined;
    if (
      codigo === 'TROCA_SENHA_OBRIGATORIA' &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/trocar-senha'
    ) {
      window.location.assign('/trocar-senha');
    }
    throw new ApiError(mensagem, resposta.status, codigo, detalhes);
  }

  return json as unknown as Resposta<T>;
}

export const api = {
  get: <T>(caminho: string) => requisitar<T>('GET', caminho),
  post: <T>(caminho: string, corpo?: unknown) =>
    requisitar<T>('POST', caminho, corpo),
  patch: <T>(caminho: string, corpo?: unknown) =>
    requisitar<T>('PATCH', caminho, corpo),
  put: <T>(caminho: string, corpo?: unknown) =>
    requisitar<T>('PUT', caminho, corpo),
  del: <T>(caminho: string, corpo?: unknown) =>
    requisitar<T>('DELETE', caminho, corpo),
};

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ApiError) {
    return erro.message;
  }
  if (erro instanceof Error) {
    return erro.message;
  }
  return 'Erro inesperado.';
}
