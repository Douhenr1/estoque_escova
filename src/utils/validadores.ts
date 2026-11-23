import { validate as validarFormatoUuid } from 'uuid';
import { AppError } from '../errors/AppError';

export function validarUuid(valor: unknown, nomeCampo = 'id'): string {
  if (typeof valor !== 'string' || !validarFormatoUuid(valor.trim())) {
    throw new AppError(`O campo "${nomeCampo}" deve ser um UUID válido.`, 400);
  }
  return valor.trim();
}

export function validarTextoObrigatorio(
  valor: unknown,
  nomeCampo: string,
  tamanhoMinimo = 2
): string {
  if (typeof valor !== 'string' || valor.trim().length === 0) {
    throw new AppError(`O campo "${nomeCampo}" é obrigatório e deve ser um texto válido.`, 400);
  }

  const textoLimpo = valor.trim();
  if (textoLimpo.length < tamanhoMinimo) {
    throw new AppError(
      `O campo "${nomeCampo}" deve ter no mínimo ${tamanhoMinimo} caracteres.`,
      400
    );
  }

  return textoLimpo;
}

export function validarTextoOpcional(valor: unknown, nomeCampo: string): string | null {
  if (valor === undefined || valor === null) {
    return null;
  }

  if (typeof valor !== 'string') {
    throw new AppError(`O campo "${nomeCampo}" deve ser um texto válido.`, 400);
  }

  const textoLimpo = valor.trim();
  return textoLimpo.length > 0 ? textoLimpo : null;
}

export function validarBooleano(valor: unknown, nomeCampo: string): boolean {
  if (typeof valor !== 'boolean') {
    throw new AppError(`O campo "${nomeCampo}" deve ser um valor booleano (true ou false).`, 400);
  }
  return valor;
}

export function validarInteiroNaoNegativo(
  valor: unknown,
  nomeCampo: string,
  statusCode = 422
): number {
  if (typeof valor !== 'number' || Number.isNaN(valor) || !Number.isInteger(valor)) {
    throw new AppError(`O campo "${nomeCampo}" deve ser um número inteiro.`, statusCode);
  }

  if (valor < 0) {
    throw new AppError(`O campo "${nomeCampo}" não pode ser negativo.`, statusCode);
  }

  return valor;
}

export function validarInteiroPositivo(
  valor: unknown,
  nomeCampo: string,
  statusCode = 422
): number {
  if (typeof valor !== 'number' || Number.isNaN(valor) || !Number.isInteger(valor)) {
    throw new AppError(`O campo "${nomeCampo}" deve ser um número inteiro.`, statusCode);
  }

  if (valor <= 0) {
    throw new AppError(`O campo "${nomeCampo}" deve ser um número inteiro positivo.`, statusCode);
  }

  return valor;
}

export function validarInteiro(
  valor: unknown,
  nomeCampo: string,
  statusCode = 422
): number {
  if (typeof valor !== 'number' || Number.isNaN(valor) || !Number.isInteger(valor)) {
    throw new AppError(`O campo "${nomeCampo}" deve ser um número inteiro.`, statusCode);
  }

  return valor;
}

export function validarNumeroPositivo(
  valor: unknown,
  nomeCampo: string,
  statusCode = 422
): number {
  if (typeof valor !== 'number' || Number.isNaN(valor) || !Number.isFinite(valor)) {
    throw new AppError(`O campo "${nomeCampo}" deve ser um número válido.`, statusCode);
  }

  if (valor <= 0) {
    throw new AppError(`O campo "${nomeCampo}" deve ser maior que zero.`, statusCode);
  }

  return valor;
}
