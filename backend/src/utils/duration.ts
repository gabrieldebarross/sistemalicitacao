/** Converte durações curtas (`15m`, `7d`, `12h`) em milissegundos. */
export function duracaoParaMs(valor: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d|w)?$/i.exec(valor.trim());
  if (!match) {
    throw new Error('Duração inválida.');
  }
  const quantidade = Number(match[1]);
  const unidade = (match[2] ?? 'ms').toLowerCase();
  const fatores: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000,
  };
  return quantidade * (fatores[unidade] ?? 0);
}
