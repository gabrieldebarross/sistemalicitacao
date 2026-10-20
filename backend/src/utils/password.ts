import bcrypt from 'bcrypt';

import { env } from '../config/env.js';

/** Gera hash de senha com bcrypt. Nunca registra a senha em log. */
export function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, env.bcryptSaltRounds);
}

/** Compara senha em texto com hash, em tempo constante. */
export function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}
