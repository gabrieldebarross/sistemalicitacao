const CONECTORES = new Set([
  'de',
  'da',
  'do',
  'das',
  'dos',
  'e',
  'em',
  'a',
  'o',
  'as',
  'os',
  'para',
  'com',
]);

/**
 * Normaliza nomes: remove espaços extras e aplica Title Case, preservando
 * conectores em minúsculas. Não corrige erros ortográficos.
 */
export function normalizarNome(valor: string): string {
  const limpo = valor.trim().replace(/\s+/g, ' ');
  if (limpo.length === 0) {
    return limpo;
  }
  const palavras = limpo.toLocaleLowerCase('pt-BR').split(' ');
  return palavras
    .map((palavra, indice) => {
      if (indice > 0 && CONECTORES.has(palavra)) {
        return palavra;
      }
      return capitalizar(palavra);
    })
    .join(' ');
}

function capitalizar(palavra: string): string {
  if (palavra.length === 0) {
    return palavra;
  }
  const primeira = palavra.slice(0, 1).toLocaleUpperCase('pt-BR');
  return primeira + palavra.slice(1);
}

/** Normaliza e-mail para comparação/persistência. */
export function normalizarEmail(valor: string): string {
  return valor.trim().toLowerCase();
}
