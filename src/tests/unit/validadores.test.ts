import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../errors/AppError';
import { errorHandler } from '../../middlewares/errorHandler';
import {
  validarBooleano,
  validarInteiro,
  validarInteiroNaoNegativo,
  validarInteiroPositivo,
  validarNumeroPositivo,
  validarTextoObrigatorio,
  validarTextoOpcional,
  validarUuid,
} from '../../utils/validadores';

describe('Validadores e ErrorHandler — Testes Unitários', () => {
  it('deve validar UUID corretamente e rejeitar formato inválido', () => {
    const uuidValido = '11111111-1111-4111-8111-111111111111';
    expect(validarUuid(uuidValido)).toBe(uuidValido);
    expect(() => validarUuid('nao-e-uuid')).toThrow(AppError);
  });

  it('deve validar textos obrigatórios e opcionais', () => {
    expect(validarTextoObrigatorio('  Escova  ', 'nome')).toBe('Escova');
    expect(() => validarTextoObrigatorio('', 'nome')).toThrow(AppError);
    expect(validarTextoOpcional(undefined, 'observacoes')).toBeNull();
    expect(validarTextoOpcional('  Obs  ', 'observacoes')).toBe('Obs');
    expect(() => validarTextoOpcional(123, 'observacoes')).toThrow(AppError);
  });

  it('deve validar números inteiros, não negativos, positivos e booleanos', () => {
    expect(validarBooleano(true, 'ativo')).toBe(true);
    expect(() => validarBooleano('true', 'ativo')).toThrow(AppError);

    expect(validarInteiro(-5, 'variacao')).toBe(-5);
    expect(() => validarInteiro(2.5, 'variacao')).toThrow(AppError);

    expect(validarInteiroNaoNegativo(0, 'quantidade_estoque')).toBe(0);
    expect(() => validarInteiroNaoNegativo(-1, 'quantidade_estoque')).toThrow(AppError);

    expect(validarInteiroPositivo(10, 'quantidade_solicitada')).toBe(10);
    expect(() => validarInteiroPositivo(0, 'quantidade_solicitada')).toThrow(AppError);

    expect(validarNumeroPositivo(9.99, 'preco_unitario')).toBe(9.99);
    expect(() => validarNumeroPositivo(0, 'preco_unitario')).toThrow(AppError);
  });

  it('deve formatar AppError e erro genérico no middleware errorHandler', () => {
    const resMock = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;

    errorHandler(new AppError('Conflito de negócio', 409), {} as any, resMock, vi.fn());
    expect(resMock.status).toHaveBeenCalledWith(409);
    expect(resMock.json).toHaveBeenCalledWith({ erro: 'Conflito de negócio' });

    errorHandler(new Error('detalhe interno sensível do banco'), {} as any, resMock, vi.fn());
    expect(resMock.status).toHaveBeenCalledWith(500);
    expect(resMock.json).toHaveBeenCalledWith({ erro: 'Erro interno do servidor.' });
  });
});
