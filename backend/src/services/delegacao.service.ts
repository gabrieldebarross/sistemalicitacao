import { PERMISSIONS } from '../domain/permissions.js';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../errors/app-error.js';
import type { Delegacao } from '../models/delegacao.js';
import * as delegacaoRepo from '../repositories/delegacao.repository.js';
import * as processoRepo from '../repositories/processo.repository.js';
import * as usuarioRepo from '../repositories/usuario.repository.js';
import type { ContextoRequisicao } from '../types/context.js';
import { montarPaginado, type ResultadoPaginado } from '../utils/http.js';
import { resolverPaginacao } from '../utils/pagination.js';
import * as auditoria from './auditoria.service.js';

export interface DelegacaoDTO {
  id: number;
  origem: { id: number; nome: string } | null;
  destino: { id: number; nome: string } | null;
  processo: { id: number; numero: string; nome: string } | null;
  inicioEm: Date;
  fimEm: Date;
  motivo: string;
  canceladoEm: Date | null;
  ativa: boolean;
  criadoEm: Date;
}

function toDTO(delegacao: Delegacao): DelegacaoDTO {
  return {
    id: delegacao.id,
    origem: delegacao.origem
      ? { id: delegacao.origem.id, nome: delegacao.origem.nome }
      : null,
    destino: delegacao.destino
      ? { id: delegacao.destino.id, nome: delegacao.destino.nome }
      : null,
    processo: delegacao.processo
      ? {
          id: delegacao.processo.id,
          numero: delegacao.processo.numero,
          nome: delegacao.processo.nome,
        }
      : null,
    inicioEm: delegacao.inicioEm,
    fimEm: delegacao.fimEm,
    motivo: delegacao.motivo,
    canceladoEm: delegacao.canceladoEm,
    ativa:
      delegacao.canceladoEm === null &&
      delegacao.inicioEm <= new Date() &&
      delegacao.fimEm > new Date(),
    criadoEm: delegacao.createdAt,
  };
}

export async function listar(
  usuarioId: number,
  input: {
    incluirHistorico?: boolean;
    pagina: number;
    tamanhoPagina: number;
  },
): Promise<ResultadoPaginado<DelegacaoDTO>> {
  const { offset, limit, pagina, tamanhoPagina } = resolverPaginacao(input);
  const { itens, total } = await delegacaoRepo.listarDoUsuario(
    usuarioId,
    input.incluirHistorico ?? false,
    offset,
    limit,
  );
  return montarPaginado(
    itens.map(toDTO),
    total,
    pagina,
    tamanhoPagina,
  );
}

export async function criar(
  usuarioId: number,
  input: {
    destinoUsuarioId: number;
    processoId?: number | null;
    inicioEm: Date;
    fimEm: Date;
    motivo: string;
  },
  contexto: ContextoRequisicao,
): Promise<DelegacaoDTO> {
  if (input.destinoUsuarioId === usuarioId) {
    throw new ValidationError('Não é possível delegar tarefas para si mesmo.');
  }
  if (input.fimEm <= input.inicioEm) {
    throw new ValidationError(
      'O fim da delegação deve ser posterior ao início.',
    );
  }
  if (input.fimEm <= new Date()) {
    throw new ValidationError('O fim da delegação deve estar no futuro.');
  }

  const destino = await usuarioRepo.buscarPorId(input.destinoUsuarioId);
  if (!destino || !destino.ativo) {
    throw new ValidationError(
      'O usuário de destino não existe ou está inativo.',
    );
  }

  const processoId = input.processoId ?? null;
  if (processoId !== null) {
    const processo = await processoRepo.buscarPorId(processoId);
    if (!processo) {
      throw new NotFoundError('Processo não encontrado.');
    }
    if (['CONCLUIDO', 'ANULADO', 'REVOGADO'].includes(processo.status)) {
      throw new ConflictError(
        'Não é possível delegar tarefas de um processo encerrado.',
      );
    }
  }

  if (
    await delegacaoRepo.existeSobreposicao(
      usuarioId,
      input.destinoUsuarioId,
      processoId,
      input.inicioEm,
      input.fimEm,
    )
  ) {
    throw new ConflictError(
      'Já existe uma delegação ativa para este destino e período.',
    );
  }

  const delegacao = await delegacaoRepo.criar({
    origemUsuarioId: usuarioId,
    destinoUsuarioId: input.destinoUsuarioId,
    processoId,
    inicioEm: input.inicioEm,
    fimEm: input.fimEm,
    motivo: input.motivo.trim(),
    criadoPorId: usuarioId,
  });
  const completa = await delegacaoRepo.buscarPorId(delegacao.id);
  const dto = toDTO(completa ?? delegacao);
  await auditoria.registrar(contexto, {
    acao: 'CRIAR',
    recurso: 'delegacao',
    recursoId: dto.id,
    metadados: {
      origemId: usuarioId,
      destinoId: input.destinoUsuarioId,
      processoId,
      inicioEm: input.inicioEm,
      fimEm: input.fimEm,
    },
  });
  return dto;
}

export async function cancelar(
  usuarioId: number,
  id: number,
  contexto: ContextoRequisicao,
): Promise<DelegacaoDTO> {
  const delegacao = await delegacaoRepo.buscarPorId(id);
  if (!delegacao) {
    throw new NotFoundError('Delegação não encontrada.');
  }
  const podeGerenciar =
    delegacao.origemUsuarioId === usuarioId ||
    delegacao.destinoUsuarioId === usuarioId ||
    contexto.permissoes.has(PERMISSIONS.USUARIOS_UPDATE);
  if (!podeGerenciar) {
    throw new NotFoundError('Delegação não encontrada.');
  }
  if (delegacao.canceladoEm !== null) {
    throw new ConflictError('Delegação já está cancelada.');
  }
  await delegacaoRepo.cancelar(delegacao, usuarioId);
  const atualizada = await delegacaoRepo.buscarPorId(id);
  await auditoria.registrar(contexto, {
    acao: 'CANCELAR',
    recurso: 'delegacao',
    recursoId: id,
    metadados: {
      origemId: delegacao.origemUsuarioId,
      destinoId: delegacao.destinoUsuarioId,
      processoId: delegacao.processoId,
    },
  });
  return toDTO(atualizada ?? delegacao);
}

export async function cancelarDoUsuario(
  usuarioId: number,
  canceladoPorId: number | null,
): Promise<number> {
  return delegacaoRepo.cancelarDoUsuario(usuarioId, canceladoPorId);
}
