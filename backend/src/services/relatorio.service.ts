import * as processoRepo from '../repositories/processo.repository.js';

export type FiltroRelatorio = processoRepo.FiltroRelatorio;

export interface ResumoRelatorio extends processoRepo.PainelProcessos {
  geradoEm: Date;
}

/**
 * Indicadores gerenciais do painel. Filtros são opcionais e restringem o
 * conjunto de processos analisado (tipo, setor, status e período de criação).
 */
export async function resumo(
  filtro: FiltroRelatorio = {},
  diasSemMovimentacao = 7,
): Promise<ResumoRelatorio> {
  const indicadores = await processoRepo.painelProcessos(
    filtro,
    diasSemMovimentacao,
  );
  return { ...indicadores, geradoEm: new Date() };
}
