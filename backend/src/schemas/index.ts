import { z } from 'zod';

import { paginacaoSchema } from '../utils/pagination.js';

export { paginacaoSchema };

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const processoEtapaParamSchema = z.object({
  id: z.coerce.number().int().positive(),
  etapaId: z.coerce.number().int().positive(),
});

const textoObrigatorio = (max: number) =>
  z.string().trim().min(1, 'Campo obrigatório.').max(max);
const textoOpcional = (max: number) =>
  z.string().trim().max(max).optional();

// ---------- Auth ----------
export const loginSchema = z.object({
  email: z.string().trim().email('E-mail inválido.'),
  senha: z.string().min(1, 'Senha obrigatória.'),
});

export const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, 'Senha atual obrigatória.'),
  novaSenha: z
    .string()
    .min(8, 'A nova senha deve ter ao menos 8 caracteres.')
    .max(128),
});

export const atualizarPerfilSchema = z
  .object({
    nome: textoObrigatorio(150).optional(),
    email: z.string().trim().email('E-mail inválido.').max(180).optional(),
  })
  .refine(
    (dados) => dados.nome !== undefined || dados.email !== undefined,
    'Informe ao menos um campo para atualizar.',
  );

// ---------- Cargos ----------
export const listarCargoQuerySchema = paginacaoSchema.extend({
  busca: textoOpcional(150),
});
export const criarCargoSchema = z.object({
  nome: textoObrigatorio(150),
  nomeOriginal: textoOpcional(200),
});
export const atualizarCargoSchema = z.object({
  nome: textoObrigatorio(150).optional(),
  nomeOriginal: textoOpcional(200),
});

// ---------- Setores ----------
export const listarSetorQuerySchema = paginacaoSchema.extend({
  busca: textoOpcional(150),
  ativo: z.coerce.boolean().optional(),
});
export const criarSetorSchema = z.object({
  nome: textoObrigatorio(150),
  sigla: textoOpcional(30),
});
export const atualizarSetorSchema = z.object({
  nome: textoObrigatorio(150).optional(),
  sigla: z.string().trim().max(30).nullable().optional(),
  ativo: z.boolean().optional(),
});

// ---------- Tipos de processo ----------
export const listarTipoProcessoQuerySchema = paginacaoSchema.extend({
  busca: textoOpcional(120),
  ativo: z.coerce.boolean().optional(),
});
export const criarTipoProcessoSchema = z.object({
  nome: textoObrigatorio(120),
  descricao: textoOpcional(2000),
  baseLegal: textoOpcional(255),
});
export const atualizarTipoProcessoSchema = z.object({
  nome: textoObrigatorio(120).optional(),
  descricao: z.string().trim().max(2000).nullable().optional(),
  baseLegal: z.string().trim().max(255).nullable().optional(),
  ativo: z.boolean().optional(),
});

// ---------- Usuários ----------
export const listarUsuarioQuerySchema = paginacaoSchema.extend({
  busca: textoOpcional(180),
  ativo: z.coerce.boolean().optional(),
});
export const criarUsuarioSchema = z.object({
  nome: textoObrigatorio(150),
  email: z.string().trim().email('E-mail inválido.').max(180),
  senha: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.').max(128),
  cargoId: z.coerce.number().int().positive().nullable().optional(),
  roleIds: z.array(z.coerce.number().int().positive()).optional(),
  ativo: z.boolean().optional(),
});
export const atualizarUsuarioSchema = z.object({
  nome: textoObrigatorio(150).optional(),
  email: z.string().trim().email('E-mail inválido.').max(180).optional(),
  senha: z
    .string()
    .min(8, 'A senha deve ter ao menos 8 caracteres.')
    .max(128)
    .optional(),
  cargoId: z.coerce.number().int().positive().nullable().optional(),
  ativo: z.boolean().optional(),
});
export const definirRolesSchema = z.object({
  roleIds: z.array(z.coerce.number().int().positive()),
});
export const definirSetoresSchema = z
  .object({
    setorIds: z
      .array(z.coerce.number().int().positive())
      .max(50, 'Informe no máximo 50 setores.'),
    setorPrincipalId: z.coerce.number().int().positive().nullable().optional(),
  })
  .superRefine((dados, contexto) => {
    if (
      dados.setorPrincipalId !== undefined &&
      dados.setorPrincipalId !== null &&
      !dados.setorIds.includes(dados.setorPrincipalId)
    ) {
      contexto.addIssue({
        code: 'custom',
        path: ['setorPrincipalId'],
        message: 'O setor principal deve estar entre os setores selecionados.',
      });
    }
  });

// ---------- Papéis / permissões ----------
export const definirPermissoesSchema = z.object({
  permissionIds: z.array(z.coerce.number().int().positive()),
});
export const atualizarRoleSchema = z.object({
  descricao: z.string().trim().max(500).nullable().optional(),
});

// ---------- Fluxos ----------
const situacaoFluxoSchema = z.enum(['RASCUNHO', 'PUBLICADO', 'ARQUIVADO']);

export const listarFluxoQuerySchema = paginacaoSchema.extend({
  tipoProcessoId: z.coerce.number().int().positive().optional(),
  situacao: situacaoFluxoSchema.optional(),
});
export const listarFluxosDisponiveisQuerySchema = z.object({
  tipoProcessoId: z.coerce.number().int().positive(),
});
export const criarFluxoSchema = z.object({
  tipoProcessoId: z.coerce.number().int().positive(),
  nome: textoObrigatorio(150),
  descricao: textoOpcional(2000),
});
export const atualizarFluxoSchema = z.object({
  nome: textoObrigatorio(150).optional(),
  descricao: z.string().trim().max(2000).nullable().optional(),
});
export const clonarFluxoSchema = z.object({
  nome: textoObrigatorio(150).optional(),
});
export const criarFaseSchema = z.object({
  nome: textoObrigatorio(150),
  ordem: z.coerce.number().int().positive().optional(),
  descricao: textoOpcional(2000),
});
export const atualizarFaseSchema = z.object({
  nome: textoObrigatorio(150).optional(),
  ordem: z.coerce.number().int().positive().optional(),
  descricao: z.string().trim().max(2000).nullable().optional(),
});
export const criarEtapaSchema = z.object({
  nome: textoObrigatorio(150),
  ordem: z.coerce.number().int().positive().optional(),
  obrigatoria: z.boolean().optional(),
  prazoGestaoDias: z.coerce.number().int().positive().nullable().optional(),
  responsavelSetorId: z.coerce.number().int().positive().nullable().optional(),
  responsavelCargoId: z.coerce.number().int().positive().nullable().optional(),
  responsavelUsuarioId: z.coerce.number().int().positive().nullable().optional(),
  descricao: textoOpcional(2000),
  requisitos: textoOpcional(2000),
  referenciaLegal: textoOpcional(255),
  condicional: z.boolean().optional(),
  condicaoAplicabilidade: textoOpcional(2000),
  permitePulo: z.boolean().optional(),
});
export const atualizarEtapaSchema = criarEtapaSchema.partial();

// ---------- Processos ----------
const statusProcessoSchema = z.enum([
  'RASCUNHO',
  'EM_ANDAMENTO',
  'SUSPENSO',
  'CONCLUIDO',
  'ANULADO',
  'REVOGADO',
]);

export const listarProcessoQuerySchema = paginacaoSchema.extend({
  status: statusProcessoSchema.optional(),
  tipoProcessoId: z.coerce.number().int().positive().optional(),
  setorAtualId: z.coerce.number().int().positive().optional(),
  responsavelAtualId: z.coerce.number().int().positive().optional(),
  busca: textoOpcional(500),
});
export const selecaoEtapaCondicionalSchema = z
  .object({
    etapaId: z.coerce.number().int().positive(),
    aplicavel: z.boolean(),
    justificativa: textoOpcional(2000),
  })
  .superRefine((dados, contexto) => {
    if (!dados.aplicavel && (!dados.justificativa || dados.justificativa.trim().length < 5)) {
      contexto.addIssue({
        code: 'custom',
        path: ['justificativa'],
        message: 'Informe a justificativa para a etapa não aplicável.',
      });
    }
  });

export const criarProcessoSchema = z.object({
  numero: textoObrigatorio(50),
  nome: textoObrigatorio(150).optional(),
  objeto: textoObrigatorio(500),
  descricao: textoOpcional(4000),
  tipoProcessoId: z.coerce.number().int().positive(),
  fluxoId: z.coerce.number().int().positive().optional(),
  etapasCondicionais: z
    .array(selecaoEtapaCondicionalSchema)
    .max(200)
    .optional(),
});
export const atualizarProcessoSchema = z.object({
  nome: textoObrigatorio(150).optional(),
  objeto: textoObrigatorio(500).optional(),
  descricao: z.string().trim().max(4000).nullable().optional(),
});
export const concluirEtapaSchema = z.object({
  parecer: textoOpcional(4000),
});
export const devolverEtapaSchema = z.object({
  motivo: z.string().trim().min(3, 'Informe o motivo.').max(2000),
  paraEtapaId: z.coerce.number().int().positive().optional(),
});
export const atribuirProcessoSchema = z.object({
  responsavelAtualId: z.coerce.number().int().positive().nullable().optional(),
  setorAtualId: z.coerce.number().int().positive().nullable().optional(),
});
export const atribuirEtapaSchema = z.object({
  responsavelId: z.coerce.number().int().positive().nullable(),
  setorId: z.coerce.number().int().positive().nullable().optional(),
});
export const atualizarPrazoEtapaSchema = z.object({
  prazoGestaoDias: z.coerce.number().int().positive().nullable(),
});
export const justificativaSchema = z.object({
  justificativa: z.string().trim().min(5, 'Justificativa obrigatória.').max(2000),
});
export const encerrarProcessoSchema = z.object({
  justificativa: z.string().trim().min(5, 'Justificativa obrigatória.').max(2000),
});
export const bloquearEtapaSchema = z.object({
  motivo: z.string().trim().min(5, 'Informe o motivo do bloqueio.').max(2000),
});
export const desbloquearEtapaSchema = z.object({
  justificativa: z
    .string()
    .trim()
    .min(5, 'Informe a justificativa do desbloqueio.')
    .max(2000),
});
export const pularEtapaSchema = z.object({
  justificativa: z
    .string()
    .trim()
    .min(5, 'Informe a justificativa do pulo da etapa.')
    .max(2000),
});

// ---------- Auditoria ----------
export const listarAuditoriaQuerySchema = paginacaoSchema.extend({
  usuarioId: z.coerce.number().int().positive().optional(),
  acao: textoOpcional(100),
  recurso: textoOpcional(100),
  desde: z.coerce.date().optional(),
  ate: z.coerce.date().optional(),
});

// ---------- Relatórios / painel ----------
export const relatorioResumoQuerySchema = z.object({
  tipoProcessoId: z.coerce.number().int().positive().optional(),
  setorId: z.coerce.number().int().positive().optional(),
  status: statusProcessoSchema.optional(),
  desde: z.coerce.date().optional(),
  ate: z.coerce.date().optional(),
  diasSemMovimentacao: z.coerce.number().int().positive().max(365).optional(),
});
