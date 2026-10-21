/**
 * Gera diffs de auditoria a partir de uma lista explícita de campos (allowlist).
 * Nunca inclui campos fora da lista e mascara valores sensíveis. Textos longos
 * são truncados para manter a trilha legível e evitar armazenamento excessivo.
 */

const LIMITE_TEXTO = 500;
const CAMPOS_SENSIVEIS = [
  'senha',
  'senhahash',
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'secret',
  'segredo',
  'chaveprivada',
];

export interface AlteracaoAuditavel {
  anterior: unknown;
  novo: unknown;
}

export type DiferencasAuditoria = Record<string, AlteracaoAuditavel>;

const CAMPOS_SENSIVEIS_NORMALIZADOS = new Set(
  CAMPOS_SENSIVEIS.map((campo) => campo.toLowerCase()),
);

function campoEhSensivel(campo: string): boolean {
  return CAMPOS_SENSIVEIS_NORMALIZADOS.has(campo.toLowerCase());
}

function normalizarValor(campo: string, valor: unknown): unknown {
  if (campoEhSensivel(campo)) {
    return valor === null || valor === undefined ? null : '[PROTEGIDO]';
  }
  if (valor === undefined) {
    return null;
  }
  if (valor instanceof Date) {
    return valor.toISOString();
  }
  if (typeof valor === 'string') {
    return valor.length > LIMITE_TEXTO
      ? `${valor.slice(0, LIMITE_TEXTO)}…`
      : valor;
  }
  if (Array.isArray(valor)) {
    return valor.map((item) => normalizarValor(campo, item));
  }
  if (valor !== null && typeof valor === 'object') {
    const serializado = JSON.stringify(valor);
    return serializado.length > LIMITE_TEXTO
      ? `${serializado.slice(0, LIMITE_TEXTO)}…`
      : serializado;
  }
  return valor;
}

export function diffAuditoria(
  antes: Record<string, unknown>,
  depois: Record<string, unknown>,
  campos: readonly string[],
): DiferencasAuditoria {
  const diferencas: DiferencasAuditoria = {};
  for (const campo of campos) {
    const anterior = normalizarValor(campo, antes[campo]);
    const novo = normalizarValor(campo, depois[campo]);
    const mudou = campoEhSensivel(campo)
      ? antes[campo] !== depois[campo]
      : JSON.stringify(anterior) !== JSON.stringify(novo);
    if (mudou) {
      diferencas[campo] = { anterior, novo };
    }
  }
  return diferencas;
}
