import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';

export function errorHandler(
  erro: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (erro instanceof AppError) {
    const corpoResposta: { erro: string; detalhes?: string[] } = {
      erro: erro.message,
    };

    if (erro.detalhes && erro.detalhes.length > 0) {
      corpoResposta.detalhes = erro.detalhes;
    }

    res.status(erro.statusCode).json(corpoResposta);
    return;
  }

  // Trata JSON malformado enviado no corpo da requisição
  if (
    erro instanceof SyntaxError &&
    'status' in erro &&
    (erro as SyntaxError & { status?: number }).status === 400
  ) {
    res.status(400).json({ erro: 'Corpo da requisição JSON inválido.' });
    return;
  }

  // Nunca expõe detalhes internos do banco de dados ou credenciais ao cliente
  if (process.env.NODE_ENV !== 'test') {
    console.error('[Erro interno não tratado]:', erro);
  }

  res.status(500).json({ erro: 'Erro interno do servidor.' });
}
