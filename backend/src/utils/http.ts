import type { Response } from 'express';

/** Resposta de sucesso no formato padrão da API. */
export function responderOk<T>(res: Response, dados: T, status = 200): void {
  res.status(status).json({ sucesso: true, dados });
}

export interface Paginacao {
  pagina: number;
  tamanhoPagina: number;
}

export interface ResultadoPaginado<T> {
  itens: T[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
  totalPaginas: number;
}

export function responderPaginado<T>(
  res: Response,
  resultado: ResultadoPaginado<T>,
): void {
  res.json({ sucesso: true, dados: resultado.itens, paginacao: {
    total: resultado.total,
    pagina: resultado.pagina,
    tamanhoPagina: resultado.tamanhoPagina,
    totalPaginas: resultado.totalPaginas,
  } });
}

export function montarPaginado<T>(
  itens: T[],
  total: number,
  pagina: number,
  tamanhoPagina: number,
): ResultadoPaginado<T> {
  return {
    itens,
    total,
    pagina,
    tamanhoPagina,
    totalPaginas: tamanhoPagina > 0 ? Math.ceil(total / tamanhoPagina) : 0,
  };
}
