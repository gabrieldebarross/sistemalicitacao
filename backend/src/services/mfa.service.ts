import { randomBytes } from 'node:crypto';

import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';

import { env } from '../config/env.js';
import { PERMISSIONS } from '../domain/permissions.js';
import { ConflictError, ValidationError } from '../errors/app-error.js';
import type { Usuario } from '../models/usuario.js';
import * as codigoRepo from '../repositories/mfa-codigo.repository.js';
import { sequelize } from '../config/database.js';
import {
  criptografarSegredo,
  descriptografarSegredo,
  hashToken,
} from '../utils/security.js';

const PERMISSOES_ADMINISTRATIVAS: readonly string[] = [
  PERMISSIONS.USUARIOS_CREATE,
  PERMISSIONS.USUARIOS_UPDATE,
  PERMISSIONS.USUARIOS_DEACTIVATE,
  PERMISSIONS.ROLES_MANAGE,
  PERMISSIONS.PERMISSIONS_MANAGE,
];

export function exigeMfa(permissoes: ReadonlySet<string>): boolean {
  return PERMISSOES_ADMINISTRATIVAS.some((permissao) =>
    permissoes.has(permissao),
  );
}

export function precisaVerificarMfa(
  usuario: Usuario,
  permissoes: ReadonlySet<string>,
): boolean {
  return usuario.mfaAtivo || exigeMfa(permissoes);
}

function normalizarCodigo(codigo: string): string {
  return codigo.replace(/[^a-z0-9]/gi, '').toUpperCase();
}

function codigoRecuperacao(): string {
  return randomBytes(5).toString('hex').toUpperCase();
}

export interface ConfiguracaoMfa {
  segredo: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export async function iniciarConfiguracao(
  usuario: Usuario,
): Promise<ConfiguracaoMfa> {
  if (usuario.mfaAtivo) {
    throw new ConflictError('MFA já está ativo para este usuário.');
  }
  const segredo = generateSecret();
  usuario.mfaSegredoCriptografado = criptografarSegredo(segredo);
  usuario.mfaConfiguradoEm = null;
  usuario.mfaResetadoEm = null;
  await usuario.save();

  const otpauthUrl = generateURI({
    issuer: env.mfa.issuer,
    label: usuario.email,
    secret: segredo,
  });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
    margin: 1,
    width: 240,
  });
  return { segredo, otpauthUrl, qrCodeDataUrl };
}

export async function confirmarConfiguracao(
  usuario: Usuario,
  codigo: string,
): Promise<{ codigosRecuperacao: string[] }> {
  if (!usuario.mfaSegredoCriptografado) {
    throw new ConflictError('Inicie a configuração de MFA antes de confirmar.');
  }
  const segredo = descriptografarSegredo(
    usuario.mfaSegredoCriptografado,
  );
  const resultado = await verify({
    token: normalizarCodigo(codigo),
    secret: segredo,
    epochTolerance: 30,
  });
  if (!resultado.valid) {
    throw new ValidationError('Código de verificação inválido.');
  }

  const codigos = Array.from({ length: 10 }, () => codigoRecuperacao());
  const hashes = codigos.map((item) => hashToken(normalizarCodigo(item)));

  await sequelize.transaction(async (transaction) => {
    usuario.mfaAtivo = true;
    usuario.mfaConfiguradoEm = new Date();
    await usuario.save({ transaction });
    await codigoRepo.destruirDoUsuario(usuario.id, transaction);
    await codigoRepo.criarVarios(usuario.id, hashes, transaction);
  });

  return {
    codigosRecuperacao: codigos.map(
      (item) => `${item.slice(0, 5)}-${item.slice(5)}`,
    ),
  };
}

export async function verificarCodigo(
  usuario: Usuario,
  codigo: string,
): Promise<'TOTP' | 'RECUPERACAO' | null> {
  const normalizado = normalizarCodigo(codigo);
  if (usuario.mfaAtivo && usuario.mfaSegredoCriptografado) {
    const segredo = descriptografarSegredo(
      usuario.mfaSegredoCriptografado,
    );
    const resultado = await verify({
      token: normalizado,
      secret: segredo,
      epochTolerance: 30,
    });
    if (resultado.valid) {
      return 'TOTP';
    }
  }

  const hash = hashToken(normalizado);
  const registro = await codigoRepo.buscarNaoUsadoPorHash(usuario.id, hash);
  if (!registro) {
    return null;
  }
  const afetadas = await codigoRepo.marcarUsado(registro.id);
  return afetadas > 0 ? 'RECUPERACAO' : null;
}

export async function resetarMfa(usuario: Usuario): Promise<void> {
  await sequelize.transaction(async (transaction) => {
    usuario.mfaAtivo = false;
    usuario.mfaSegredoCriptografado = null;
    usuario.mfaConfiguradoEm = null;
    usuario.mfaResetadoEm = new Date();
    await usuario.save({ transaction });
    await codigoRepo.destruirDoUsuario(usuario.id, transaction);
  });
}

export async function contarCodigosRecuperacao(
  usuarioId: number,
): Promise<number> {
  return codigoRepo.contarDisponiveis(usuarioId);
}
