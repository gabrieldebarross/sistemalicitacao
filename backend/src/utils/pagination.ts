import { z } from 'zod';

export const MAX_PAGE_SIZE = 100;

export const paginacaoSchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  tamanhoPagina: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
});

export interface PaginacaoParams {
  pagina: number;
  tamanhoPagina: number;
  offset: number;
  limit: number;
}

export function resolverPaginacao(input: {
  pagina: number;
  tamanhoPagina: number;
}): PaginacaoParams {
  const offset = (input.pagina - 1) * input.tamanhoPagina;
  return {
    pagina: input.pagina,
    tamanhoPagina: input.tamanhoPagina,
    offset,
    limit: input.tamanhoPagina,
  };
}
