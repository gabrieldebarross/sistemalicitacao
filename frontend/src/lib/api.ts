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
  resumo?: unknown;
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

function montarHeaders(metodo: string, corpo: unknown): Record<string, string> {
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
  return headers;
}

async function enviar(
  metodo: string,
  caminho: string,
  corpo: unknown,
): Promise<{ resposta: Response; json: Record<string, unknown> }> {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    method: metodo,
    headers: montarHeaders(metodo, corpo),
    credentials: 'include',
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });
  const texto = await resposta.text();
  let json: Record<string, unknown> = {};
  if (texto) {
    try {
      json = JSON.parse(texto) as Record<string, unknown>;
    } catch {
      json = {};
    }
  }
  return { resposta, json };
}

export const EVENTO_SESSAO_EXPIRADA = 'tramitay:sessao-expirada';

function notificarSessaoExpirada(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
  if (window.location.pathname !== '/login') {
    window.location.replace('/login?motivo=sessao-expirada');
  }
}

let renovacaoEmAndamento: Promise<boolean> | null = null;

async function renovarSessao(): Promise<boolean> {
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = (async () => {
      try {
        const { resposta } = await enviar('POST', '/auth/refresh', undefined);
        return resposta.ok;
      } catch {
        return false;
      } finally {
        renovacaoEmAndamento = null;
      }
    })();
  }
  return renovacaoEmAndamento;
}

function podeRenovar(caminho: string): boolean {
  return ![
    '/auth/login',
    '/auth/refresh',
    '/auth/logout',
    '/auth/mfa/configurar',
    '/auth/mfa/confirmar',
    '/auth/mfa/verificar',
  ].some((prefixo) => caminho.startsWith(prefixo));
}

async function requisitar<T>(
  metodo: string,
  caminho: string,
  corpo?: unknown,
  tentarRenovar = true,
): Promise<Resposta<T>> {
  let { resposta, json } = await enviar(metodo, caminho, corpo);

  if (
    resposta.status === 401 &&
    tentarRenovar &&
    podeRenovar(caminho) &&
    (await renovarSessao())
  ) {
    ({ resposta, json } = await enviar(metodo, caminho, corpo));
  }

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
    if (resposta.status === 401 && podeRenovar(caminho)) {
      notificarSessaoExpirada();
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
