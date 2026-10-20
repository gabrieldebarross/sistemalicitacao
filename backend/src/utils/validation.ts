import type { ZodType } from 'zod';

import { ValidationError } from '../errors/app-error.js';

/**
 * Valida dados com Zod e converte falhas no erro de validação padronizado.
 * As mensagens são de domínio, nunca internas.
 */
export function validar<T>(schema: ZodType<T>, dados: unknown): T {
  const resultado = schema.safeParse(dados);
  if (!resultado.success) {
    const detalhes: Record<string, string[]> = {};
    for (const issue of resultado.error.issues) {
      const chave = issue.path.length > 0 ? issue.path.join('.') : '_';
      const lista = detalhes[chave] ?? [];
      lista.push(issue.message);
      detalhes[chave] = lista;
    }
    throw new ValidationError('Dados inválidos.', detalhes);
  }
  return resultado.data;
}
