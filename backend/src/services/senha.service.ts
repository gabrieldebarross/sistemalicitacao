import type { Transaction } from 'sequelize';

import { env } from '../config/env.js';
import { ValidationError } from '../errors/app-error.js';
import type { Usuario } from '../models/usuario.js';
import * as historicoRepo from '../repositories/senha-historico.repository.js';
import { hashSenha, verificarSenha } from '../utils/password.js';

export async function validarPoliticaSenha(
  usuario: Usuario,
  novaSenha: string,
): Promise<string> {
  if (novaSenha.length < env.password.minLength) {
    throw new ValidationError(
      `A senha deve ter ao menos ${env.password.minLength} caracteres.`,
    );
  }
  const hashes = [
    usuario.senhaHash,
    ...(
      await historicoRepo.listarRecentes(
        usuario.id,
        env.password.historySize,
      )
    ).map((item) => item.senhaHash),
  ];
  for (const hash of hashes) {
    if (await verificarSenha(novaSenha, hash)) {
      throw new ValidationError(
        `A senha não pode ser igual a uma das últimas ${env.password.historySize} senhas.`,
      );
    }
  }
  return hashSenha(novaSenha);
}

export async function registrarSenha(
  usuarioId: number,
  hash: string,
  transaction?: Transaction,
): Promise<void> {
  await historicoRepo.criar(usuarioId, hash, transaction);
  await historicoRepo.podar(usuarioId, transaction);
}

export async function senhaConfere(
  senha: string,
  hash: string,
): Promise<boolean> {
  return verificarSenha(senha, hash);
}
