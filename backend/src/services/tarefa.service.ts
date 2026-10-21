import type { ProcessoEtapaStatus } from '../domain/enums.js';
import * as tarefaRepo from '../repositories/tarefa.repository.js';
import type { ResultadoPaginado } from '../utils/http.js';
import { resolverPaginacao } from '../utils/pagination.js';

export interface TarefaDTO {
  id: number;
  processo: {
    id: number;
    numero: string;
    nome: string;
    status: string;
    responsavel: { id: number; nome: string } | null;
    setor: { id: number; nome: string } | null;
  };
  etapa: {
    id: number;
    nome: string;
    status: ProcessoEtapaStatus;
    obrigatoria: boolean;
    dataPrevista: Date | null;
  };
  responsavel: { id: number; nome: string } | null;
  setor: { id: number; nome: string } | null;
  atrasada: boolean;
  diasAtraso: number | null;
  proximaAcao: 'INICIAR' | 'CONCLUIR' | 'DESBLOQUEAR';
}

export interface ResumoTarefas {
  total: number;
  atrasadas: number;
  hoje: number;
  semPrazo: number;
  porStatus: Record<string, number>;
}

export interface ResultadoTarefas extends ResultadoPaginado<TarefaDTO> {
  resumo: ResumoTarefas;
}

function proximaAcao(status: ProcessoEtapaStatus): TarefaDTO['proximaAcao'] {
  if (status === 'BLOQUEADA') {
    return 'DESBLOQUEAR';
  }
  if (status === 'EM_ANDAMENTO') {
    return 'CONCLUIR';
  }
  return 'INICIAR';
}

function mesmoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

async function coletar(
  usuarioId: number,
): Promise<{ itens: TarefaDTO[]; resumo: ResumoTarefas }> {
  const agora = new Date();
  const registros = await tarefaRepo.listarCandidatas([usuarioId]);

  const itens: TarefaDTO[] = [];
  for (const registro of registros) {
    const { etapa, processo } = registro;
    // Etapas futuras permanecem PENDENTE no snapshot, mas só a etapa atual é
    // acionável. Assim, não poluem a lista de tarefas do responsável.
    if (
      etapa.status === 'PENDENTE' &&
      processo.processoEtapaAtualId !== etapa.id
    ) {
      continue;
    }
    if (etapa.responsavelId !== usuarioId) {
      continue;
    }

    const dataPrevista = etapa.dataPrevista;
    const atrasada = dataPrevista !== null && dataPrevista < agora;
    const diasAtraso = atrasada
      ? Math.max(
          1,
          Math.floor((agora.getTime() - dataPrevista.getTime()) / 86_400_000),
        )
      : null;

    itens.push({
      id: etapa.id,
      processo: {
        id: processo.id,
        numero: processo.numero,
        nome: processo.nome,
        status: processo.status,
        responsavel: processo.responsavelAtual
          ? {
              id: processo.responsavelAtual.id,
              nome: processo.responsavelAtual.nome,
            }
          : null,
        setor: processo.setorAtual
          ? { id: processo.setorAtual.id, nome: processo.setorAtual.nome }
          : null,
      },
      etapa: {
        id: etapa.id,
        nome: etapa.nome,
        status: etapa.status,
        obrigatoria: etapa.obrigatoria,
        dataPrevista,
      },
      responsavel: etapa.responsavel
        ? { id: etapa.responsavel.id, nome: etapa.responsavel.nome }
        : null,
      setor: etapa.setor
        ? { id: etapa.setor.id, nome: etapa.setor.nome }
        : null,
      atrasada,
      diasAtraso,
      proximaAcao: proximaAcao(etapa.status),
    });
  }

  itens.sort((a, b) => {
    const aPrazo = a.etapa.dataPrevista?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bPrazo = b.etapa.dataPrevista?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return aPrazo - bPrazo || a.id - b.id;
  });

  const porStatus: Record<string, number> = {};
  for (const item of itens) {
    porStatus[item.etapa.status] = (porStatus[item.etapa.status] ?? 0) + 1;
  }
  return {
    itens,
    resumo: {
      total: itens.length,
      atrasadas: itens.filter((item) => item.atrasada).length,
      hoje: itens.filter(
        (item) =>
          item.etapa.dataPrevista !== null &&
          mesmoDia(item.etapa.dataPrevista, agora),
      ).length,
      semPrazo: itens.filter((item) => item.etapa.dataPrevista === null).length,
      porStatus,
    },
  };
}

export async function listar(
  usuarioId: number,
  input: {
    status?: ProcessoEtapaStatus;
    atrasado?: boolean;
    pagina: number;
    tamanhoPagina: number;
  },
): Promise<ResultadoTarefas> {
  const { itens, resumo } = await coletar(usuarioId);
  let filtrados = itens;
  if (input.status !== undefined) {
    filtrados = filtrados.filter((item) => item.etapa.status === input.status);
  }
  if (input.atrasado !== undefined) {
    filtrados = filtrados.filter((item) => item.atrasada === input.atrasado);
  }
  const { offset, limit, pagina, tamanhoPagina } = resolverPaginacao(input);
  const total = filtrados.length;
  const paginaItens = filtrados.slice(offset, offset + limit);
  return {
    itens: paginaItens,
    total,
    pagina,
    tamanhoPagina,
    totalPaginas: tamanhoPagina > 0 ? Math.ceil(total / tamanhoPagina) : 1,
    resumo,
  };
}

export async function resumo(usuarioId: number): Promise<ResumoTarefas> {
  return (await coletar(usuarioId)).resumo;
}
