export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: any,
    public readonly isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;

    // Mantém o stack trace limpo (opcional)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Exemplos de erros específicos (opcional)
export class NotFoundError extends ApiError {
  constructor(entity: string, details?: any) {
    super(404, `${entity} não encontrado`, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Não autorizado") {
    super(401, message);
  }
}
