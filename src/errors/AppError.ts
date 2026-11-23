export class AppError extends Error {
  public readonly statusCode: number;
  public readonly detalhes?: string[];

  constructor(mensagem: string, statusCode = 400, detalhes?: string[]) {
    super(mensagem);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.detalhes = detalhes;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
