import { Permission } from '../models/permission.js';

export async function listar(): Promise<Permission[]> {
  return Permission.findAll({ order: [['codigo', 'ASC']] });
}

export async function buscarPorCodigos(
  codigos: readonly string[],
): Promise<Permission[]> {
  if (codigos.length === 0) {
    return [];
  }
  return Permission.findAll({ where: { codigo: codigos } });
}

export async function buscarPorId(id: number): Promise<Permission | null> {
  return Permission.findByPk(id);
}
