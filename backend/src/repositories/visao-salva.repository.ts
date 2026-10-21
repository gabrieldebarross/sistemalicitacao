import { VisaoSalva } from '../models/visao-salva.js';

export async function listarPorUsuario(usuarioId: number): Promise<VisaoSalva[]> {
  return VisaoSalva.findAll({
    where: { usuarioId },
    order: [['nome', 'ASC']],
  });
}

export async function buscarDoUsuario(
  id: number,
  usuarioId: number,
): Promise<VisaoSalva | null> {
  return VisaoSalva.findOne({ where: { id, usuarioId } });
}

export async function buscarPorNome(
  usuarioId: number,
  nome: string,
): Promise<VisaoSalva | null> {
  return VisaoSalva.findOne({ where: { usuarioId, nome } });
}

export async function criar(
  usuarioId: number,
  nome: string,
  filtros: Record<string, unknown>,
): Promise<VisaoSalva> {
  return VisaoSalva.create({ usuarioId, nome, filtros });
}

export async function atualizar(
  visao: VisaoSalva,
  dados: { nome?: string; filtros?: Record<string, unknown> },
): Promise<VisaoSalva> {
  return visao.update(dados);
}

export async function remover(visao: VisaoSalva): Promise<void> {
  await visao.destroy();
}
