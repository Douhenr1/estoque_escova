import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../errors/AppError';
import { Categoria } from '../../models/categoria.model';
import { Produto } from '../../models/produto.model';
import { ICategoriaRepository } from '../../repositories/categoria.repository';
import { IProdutoRepository } from '../../repositories/produto.repository';
import { ProdutoService } from '../../services/produto.service';

const CATEGORIA_ID_VALIDA = '11111111-1111-4111-8111-111111111111';
const PRODUTO_ID_VALIDO = '22222222-2222-4222-8222-222222222222';

const categoriaExemplo: Categoria = {
  id: CATEGORIA_ID_VALIDA,
  nome: 'Infantil',
  descricao: 'Escovas infantis com cerdas macias',
  ativo: true,
};

const produtoExemplo: Produto = {
  id: PRODUTO_ID_VALIDO,
  categoria_id: CATEGORIA_ID_VALIDA,
  nome: 'EscovaMax Kids',
  descricao: 'Escova infantil com cabo antiderrapante',
  tipo_cerdas: 'macia',
  quantidade_estoque: 10,
  estoque_minimo: 5,
  preco_unitario: 12.9,
  ativo: true,
};

describe('ProdutoService — Testes Unitários (RN01 e RN03)', () => {
  let produtoRepositoryMock: IProdutoRepository;
  let categoriaRepositoryMock: ICategoriaRepository;
  let produtoService: ProdutoService;

  beforeEach(() => {
    produtoRepositoryMock = {
      listarTodos: vi.fn(),
      buscarPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn(),
      excluir: vi.fn(),
      possuiPedidosVinculados: vi.fn(),
    };

    categoriaRepositoryMock = {
      listarTodas: vi.fn(),
      buscarPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn(),
      excluir: vi.fn(),
      possuiProdutosVinculados: vi.fn(),
    };

    produtoService = new ProdutoService(produtoRepositoryMock, categoriaRepositoryMock);
  });

  describe('TU01 — RN01: Impedir estoque negativo', () => {
    it('deve rejeitar o cadastro de produto com quantidade_estoque negativa (HTTP 422) sem persistir', async () => {
      await expect(
        produtoService.cadastrarProduto({
          categoria_id: CATEGORIA_ID_VALIDA,
          nome: 'Escova Negativa',
          descricao: 'Teste de estoque negativo',
          tipo_cerdas: 'macia',
          quantidade_estoque: -5,
          estoque_minimo: 2,
          preco_unitario: 9.9,
        })
      ).rejects.toMatchObject({
        statusCode: 422,
      });

      expect(produtoRepositoryMock.criar).not.toHaveBeenCalled();
    });

    it('deve rejeitar o cadastro de produto com quantidade_estoque decimal (HTTP 422) sem persistir', async () => {
      await expect(
        produtoService.cadastrarProduto({
          categoria_id: CATEGORIA_ID_VALIDA,
          nome: 'Escova Decimal',
          descricao: 'Teste de estoque decimal',
          tipo_cerdas: 'media',
          quantidade_estoque: 10.5,
          estoque_minimo: 2,
          preco_unitario: 14.5,
        })
      ).rejects.toBeInstanceOf(AppError);

      expect(produtoRepositoryMock.criar).not.toHaveBeenCalled();
    });

    it('deve rejeitar atualização de produto que defina quantidade_estoque negativa (HTTP 422) sem persistir', async () => {
      await expect(
        produtoService.atualizarProduto(PRODUTO_ID_VALIDO, {
          quantidade_estoque: -1,
        })
      ).rejects.toMatchObject({
        statusCode: 422,
      });

      expect(produtoRepositoryMock.atualizar).not.toHaveBeenCalled();
    });

    it('deve rejeitar movimentação de retirada maior que o estoque atual (10 - 15) mantendo o estoque intacto', async () => {
      vi.mocked(produtoRepositoryMock.buscarPorId).mockResolvedValue(produtoExemplo);

      await expect(
        produtoService.movimentarEstoque(PRODUTO_ID_VALIDO, -15)
      ).rejects.toMatchObject({
        statusCode: 422,
      });

      expect(produtoRepositoryMock.atualizar).not.toHaveBeenCalled();
    });

    it('deve permitir movimentação de estoque válida quando o saldo final permanece maior ou igual a zero', async () => {
      vi.mocked(produtoRepositoryMock.buscarPorId).mockResolvedValue(produtoExemplo);
      vi.mocked(produtoRepositoryMock.atualizar).mockResolvedValue({
        ...produtoExemplo,
        quantidade_estoque: 4,
      });

      const resultado = await produtoService.movimentarEstoque(PRODUTO_ID_VALIDO, -6);

      expect(resultado.quantidade_estoque).toBe(4);
      expect(produtoRepositoryMock.atualizar).toHaveBeenCalledWith(PRODUTO_ID_VALIDO, {
        quantidade_estoque: 4,
      });
    });

    it('deve permitir o cadastro de produto com estoque zero ou positivo quando os dados são válidos', async () => {
      vi.mocked(categoriaRepositoryMock.buscarPorId).mockResolvedValue(categoriaExemplo);
      vi.mocked(produtoRepositoryMock.criar).mockImplementation(async (produto) => produto);

      const criado = await produtoService.cadastrarProduto({
        categoria_id: CATEGORIA_ID_VALIDA,
        nome: 'Escova Ultra Macia',
        descricao: 'Cerdas ultrafinas para gengivas sensíveis',
        tipo_cerdas: 'macia',
        quantidade_estoque: 0,
        estoque_minimo: 10,
        preco_unitario: 15.9,
      });

      expect(criado.quantidade_estoque).toBe(0);
      expect(criado.ativo).toBe(true);
      expect(produtoRepositoryMock.criar).toHaveBeenCalledTimes(1);
    });
  });

  describe('TU03 — RN03: Impedir exclusão de produto vinculado a pedidos', () => {
    it('deve bloquear a exclusão de produto com pedidos de reposição vinculados (HTTP 409)', async () => {
      vi.mocked(produtoRepositoryMock.buscarPorId).mockResolvedValue(produtoExemplo);
      vi.mocked(produtoRepositoryMock.possuiPedidosVinculados).mockResolvedValue(true);

      await expect(
        produtoService.excluirProduto(PRODUTO_ID_VALIDO)
      ).rejects.toMatchObject({
        statusCode: 409,
      });

      expect(produtoRepositoryMock.excluir).not.toHaveBeenCalled();
    });

    it('deve permitir a exclusão de produto sem pedidos de reposição vinculados', async () => {
      vi.mocked(produtoRepositoryMock.buscarPorId).mockResolvedValue(produtoExemplo);
      vi.mocked(produtoRepositoryMock.possuiPedidosVinculados).mockResolvedValue(false);
      vi.mocked(produtoRepositoryMock.excluir).mockResolvedValue();

      await produtoService.excluirProduto(PRODUTO_ID_VALIDO);

      expect(produtoRepositoryMock.excluir).toHaveBeenCalledWith(PRODUTO_ID_VALIDO);
    });

    it('deve retornar HTTP 404 ao tentar excluir produto inexistente', async () => {
      vi.mocked(produtoRepositoryMock.buscarPorId).mockResolvedValue(null);

      await expect(
        produtoService.excluirProduto(PRODUTO_ID_VALIDO)
      ).rejects.toMatchObject({
        statusCode: 404,
      });

      expect(produtoRepositoryMock.possuiPedidosVinculados).not.toHaveBeenCalled();
      expect(produtoRepositoryMock.excluir).not.toHaveBeenCalled();
    });
  });

  describe('Validações e consultas de ProdutoService', () => {
    it('deve filtrar corretamente produtos com estoque baixo', async () => {
      vi.mocked(produtoRepositoryMock.listarTodos).mockResolvedValue([
        { ...produtoExemplo, quantidade_estoque: 3, estoque_minimo: 5 },
        { ...produtoExemplo, id: '33333333-3333-4333-8333-333333333333', quantidade_estoque: 50, estoque_minimo: 10 },
      ]);

      const resultado = await produtoService.listarProdutos({ estoque_baixo: true });

      expect(resultado).toHaveLength(1);
      expect(resultado[0].quantidade_estoque).toBe(3);
    });

    it('deve lançar HTTP 400 ao consultar produto com UUID inválido', async () => {
      await expect(produtoService.buscarProdutoPorId('id-invalido')).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it('deve lançar HTTP 404 ao cadastrar produto em categoria inexistente', async () => {
      vi.mocked(categoriaRepositoryMock.buscarPorId).mockResolvedValue(null);

      await expect(
        produtoService.cadastrarProduto({
          categoria_id: CATEGORIA_ID_VALIDA,
          nome: 'Escova Teste',
          descricao: 'Descrição válida',
          tipo_cerdas: 'dura',
          quantidade_estoque: 20,
          estoque_minimo: 5,
          preco_unitario: 19.9,
        })
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('deve lançar HTTP 422 para tipo_cerdas inválido', async () => {
      await expect(
        produtoService.cadastrarProduto({
          categoria_id: CATEGORIA_ID_VALIDA,
          nome: 'Escova Teste',
          descricao: 'Descrição válida',
          tipo_cerdas: 'extra-dura' as any,
          quantidade_estoque: 20,
          estoque_minimo: 5,
          preco_unitario: 19.9,
        })
      ).rejects.toMatchObject({
        statusCode: 422,
      });
    });
  });
});
