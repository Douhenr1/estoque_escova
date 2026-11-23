import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Categoria } from '../../models/categoria.model';
import { ICategoriaRepository } from '../../repositories/categoria.repository';
import { CategoriaService } from '../../services/categoria.service';

const CATEGORIA_ID_VALIDA = '11111111-1111-4111-8111-111111111111';

const categoriaExemplo: Categoria = {
  id: CATEGORIA_ID_VALIDA,
  nome: 'Infantil',
  descricao: 'Escovas infantis com cerdas macias',
  ativo: true,
};

describe('CategoriaService — Testes Unitários', () => {
  let categoriaRepositoryMock: ICategoriaRepository;
  let categoriaService: CategoriaService;

  beforeEach(() => {
    categoriaRepositoryMock = {
      listarTodas: vi.fn(),
      buscarPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn(),
      excluir: vi.fn(),
      possuiProdutosVinculados: vi.fn(),
    };

    categoriaService = new CategoriaService(categoriaRepositoryMock);
  });

  it('deve cadastrar uma categoria válida com ativo=true por padrão', async () => {
    vi.mocked(categoriaRepositoryMock.criar).mockImplementation(async (cat) => cat);

    const resultado = await categoriaService.cadastrarCategoria({
      nome: 'Ortodôntica',
      descricao: 'Escovas especiais para aparelhos ortodônticos',
    });

    expect(resultado.nome).toBe('Ortodôntica');
    expect(resultado.ativo).toBe(true);
    expect(categoriaRepositoryMock.criar).toHaveBeenCalledTimes(1);
  });

  it('deve rejeitar cadastro com nome menor que 2 caracteres (HTTP 400)', async () => {
    await expect(
      categoriaService.cadastrarCategoria({
        nome: 'A',
        descricao: 'Descrição válida',
      })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(categoriaRepositoryMock.criar).not.toHaveBeenCalled();
  });

  it('deve retornar HTTP 404 ao buscar categoria inexistente', async () => {
    vi.mocked(categoriaRepositoryMock.buscarPorId).mockResolvedValue(null);

    await expect(
      categoriaService.buscarCategoriaPorId(CATEGORIA_ID_VALIDA)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('deve atualizar categoria existente com dados válidos', async () => {
    vi.mocked(categoriaRepositoryMock.buscarPorId).mockResolvedValue(categoriaExemplo);
    vi.mocked(categoriaRepositoryMock.atualizar).mockResolvedValue({
      ...categoriaExemplo,
      nome: 'Infantil Plus',
    });

    const atualizada = await categoriaService.atualizarCategoria(CATEGORIA_ID_VALIDA, {
      nome: 'Infantil Plus',
    });

    expect(atualizada.nome).toBe('Infantil Plus');
  });

  it('deve impedir exclusão de categoria com produtos vinculados (HTTP 409)', async () => {
    vi.mocked(categoriaRepositoryMock.buscarPorId).mockResolvedValue(categoriaExemplo);
    vi.mocked(categoriaRepositoryMock.possuiProdutosVinculados).mockResolvedValue(true);

    await expect(
      categoriaService.excluirCategoria(CATEGORIA_ID_VALIDA)
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(categoriaRepositoryMock.excluir).not.toHaveBeenCalled();
  });

  it('deve excluir categoria sem produtos vinculados', async () => {
    vi.mocked(categoriaRepositoryMock.buscarPorId).mockResolvedValue(categoriaExemplo);
    vi.mocked(categoriaRepositoryMock.possuiProdutosVinculados).mockResolvedValue(false);
    vi.mocked(categoriaRepositoryMock.excluir).mockResolvedValue();

    await categoriaService.excluirCategoria(CATEGORIA_ID_VALIDA);

    expect(categoriaRepositoryMock.excluir).toHaveBeenCalledWith(CATEGORIA_ID_VALIDA);
  });
});
