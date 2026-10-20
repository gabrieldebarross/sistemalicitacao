/**
 * Hierarquia de erros de aplicação. Cada erro mapeia para um status HTTP e um
 * código estável consumível pelo cliente. Detalhes internos nunca são expostos.
 */
export type AppErrorDetalhes = Readonly<Record<string, unknown>>;

export class AppError extends Error {
  readonly statusCode: number;
  readonly codigo: string;
  readonly detalhes: AppErrorDetalhes | undefined;

  constructor(
    message: string,
    statusCode: number,
    codigo: string,
    detalhes?: AppErrorDetalhes,
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.codigo = codigo;
    this.detalhes = detalhes;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Dados inválidos.', detalhes?: AppErrorDetalhes) {
    super(message, 400, 'VALIDACAO', detalhes);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Credenciais inválidas.', detalhes?: AppErrorDetalhes) {
    super(message, 401, 'NAO_AUTENTICADO', detalhes);
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message = 'Acesso não autorizado.',
    detalhes?: AppErrorDetalhes,
  ) {
    super(message, 403, 'NAO_AUTORIZADO', detalhes);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado.', detalhes?: AppErrorDetalhes) {
    super(message, 404, 'NAO_ENCONTRADO', detalhes);
  }
}

export class ConflictError extends AppError {
  constructor(
    message = 'Conflito de estado da operação.',
    detalhes?: AppErrorDetalhes,
  ) {
    super(message, 409, 'CONFLITO', detalhes);
  }
}

/** Sessão válida, mas o usuário deve trocar a senha antes de continuar. */
export class PasswordChangeRequiredError extends AppError {
  constructor(
    message = 'É necessário alterar a senha provisória antes de continuar.',
    detalhes?: AppErrorDetalhes,
  ) {
    super(message, 403, 'TROCA_SENHA_OBRIGATORIA', detalhes);
  }
}

export class IntegrityError extends AppError {
  constructor(
    message = 'Violação de integridade de dados.',
    detalhes?: AppErrorDetalhes,
  ) {
    super(message, 409, 'INTEGRIDADE', detalhes);
  }
}

export class UnexpectedError extends AppError {
  constructor(
    message = 'Erro interno do servidor.',
    detalhes?: AppErrorDetalhes,
  ) {
    super(message, 500, 'ERRO_INTERNO', detalhes);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Muitas tentativas. Tente novamente mais tarde.') {
    super(message, 429, 'RATE_LIMIT');
  }
}

export class CsrfError extends AppError {
  constructor(message = 'Requisição inválida.') {
    super(message, 403, 'CSRF');
  }
}
