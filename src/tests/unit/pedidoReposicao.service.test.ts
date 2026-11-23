import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PedidoReposicao } from '../../models/pedidoReposicao.model';
import { Produto } from '../../models/produto.model';
import { IPedidoReposicaoRepository } from '../../repositories/pedidoReposicao.repository';
import { IProdutoRepository } from '../../repositories/produto.repository';
import { PedidoReposicaoService } from '../../services/pedidoReposicao.service';

const PRODUTO_ID_VALIDO = '22222222-2222-4222-8222-222222222222';
const PEDIDO_ID_VALIDO = '44444444-4444-4444-8444-444444444444';

const produtoExemplo: Produto = {
  id: PRODUTO_ID_VALIDO,
  categoria_id: '11111111-1111-4111-8111-111111111111',
  nome: 'EscovaMax Adulto',
  descricao: 'Escova adulta cerdas médias',
  tipo_cerdas: 'media',
  quantidade_estoque: 10,
  estoque_minimo: 5,
  preco_unitario: 14.9,
  ativo: true,
};

const pedidoPendenteExemplo: PedidoReposicao = {
  id: PEDIDO_ID_VALIDO,
  produto_id: PRODUTO_ID_VALIDO,
  quantidade_solicitada: 20,
  status: 'pendente',
  fornecedor: 'DenteCerto Distribuidora Ltda.',
};

describe('PedidoReposicaoService — Testes Unitários (RN02)', () => {
  let pedidoRepositoryMock: IPedidoReposicaoRepository;
  let produtoRepositoryMock: IProdutoRepository;
  let pedidoService: PedidoReposicaoService;

  beforeEach(() => {
    pedidoRepositoryMock = {
      listarTodos: vi.fn(),
      buscarPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn(),
      excluir: vi.fn(),
      receberPedidoTransacional: vi.fn(),
    };

    produtoRepositoryMock = {
      listarTodos: vi.fn(),
      buscarPorId: vi.fn(),
      criar: vi.fn(),
      atualizar: vi.fn(),
      excluir: vi.fn(),
      possuiPedidosVinculados: vi.fn(),
    };

    pedidoService = new PedidoReposicaoService(
      pedidoRepositoryMock,
      produtoRepositoryMock
    );
  });

  describe('TU02 — RN02: Impedir recebimento duplicado de pedidos', () => {
    it('deve impedir o recebimento de um pedido já recebido (HTTP 409) sem solicitar incremento de estoque', async () => {
      vi.mocked(pedidoRepositoryMock.buscarPorId).mockResolvedValue({
        ...pedidoPendenteExemplo,
        status: 'recebido',
        quantidade_recebida: 20,
      });

      await expect(
        pedidoService.receberPedido(PEDIDO_ID_VALIDO, 20)
      ).rejects.toMatchObject({
        statusCode: 409,
      });

      expect(pedidoRepositoryMock.receberPedidoTransacional).not.toHaveBeenCalled();
    });

    it('deve impedir o recebimento de pedido cancelado (HTTP 409)', async () => {
      vi.mocked(pedidoRepositoryMock.buscarPorId).mockResolvedValue({
        ...pedidoPendenteExemplo,
        status: 'cancelado',
      });

      await expect(
        pedidoService.receberPedido(PEDIDO_ID_VALIDO, 20)
      ).rejects.toMatchObject({
        statusCode: 409,
      });

      expect(pedidoRepositoryMock.receberPedidoTransacional).not.toHaveBeenCalled();
    });

    it('deve impedir o recebimento de pedido com status aprovado (somente pendente pode ser recebido)', async () => {
      vi.mocked(pedidoRepositoryMock.buscarPorId).mockResolvedValue({
        ...pedidoPendenteExemplo,
        status: 'aprovado',
      });

      await expect(
        pedidoService.receberPedido(PEDIDO_ID_VALIDO, 20)
      ).rejects.toMatchObject({
        statusCode: 409,
      });

      expect(pedidoRepositoryMock.receberPedidoTransacional).not.toHaveBeenCalled();
    });

    it('deve receber pedido pendente chamando a operação transacional exatamente uma vez', async () => {
      const pedidoRecebido: PedidoReposicao = {
        ...pedidoPendenteExemplo,
        status: 'recebido',
        quantidade_recebida: 20,
        data_recebimento: new Date().toISOString(),
      };

      vi.mocked(pedidoRepositoryMock.buscarPorId).mockResolvedValue(pedidoPendenteExemplo);
      vi.mocked(pedidoRepositoryMock.receberPedidoTransacional).mockResolvedValue(
        pedidoRecebido
      );

      const resultado = await pedidoService.receberPedido(PEDIDO_ID_VALIDO, 20);

      expect(resultado.status).toBe('recebido');
      expect(resultado.quantidade_recebida).toBe(20);
      expect(pedidoRepositoryMock.receberPedidoTransacional).toHaveBeenCalledTimes(1);
      expect(pedidoRepositoryMock.receberPedidoTransacional).toHaveBeenCalledWith(
        PEDIDO_ID_VALIDO,
        20
      );
    });

    it('deve usar quantidade_solicitada quando quantidade_recebida não for informada', async () => {
      vi.mocked(pedidoRepositoryMock.buscarPorId).mockResolvedValue(pedidoPendenteExemplo);
      vi.mocked(pedidoRepositoryMock.receberPedidoTransacional).mockResolvedValue({
        ...pedidoPendenteExemplo,
        status: 'recebido',
        quantidade_recebida: 20,
      });

      await pedidoService.receberPedido(PEDIDO_ID_VALIDO);

      expect(pedidoRepositoryMock.receberPedidoTransacional).toHaveBeenCalledWith(
        PEDIDO_ID_VALIDO,
        20
      );
    });

    it('deve impedir atualização via PUT de um pedido já recebido (HTTP 409)', async () => {
      vi.mocked(pedidoRepositoryMock.buscarPorId).mockResolvedValue({
        ...pedidoPendenteExemplo,
        status: 'recebido',
        quantidade_recebida: 20,
      });

      await expect(
        pedidoService.atualizarPedido(PEDIDO_ID_VALIDO, {
          status: 'recebido',
          quantidade_recebida: 20,
        })
      ).rejects.toMatchObject({
        statusCode: 409,
      });

      expect(pedidoRepositoryMock.receberPedidoTransacional).not.toHaveBeenCalled();
    });
  });

  describe('Cadastro, atualização e exclusão de pedidos', () => {
    it('deve cadastrar pedido com status inicial pendente', async () => {
      vi.mocked(produtoRepositoryMock.buscarPorId).mockResolvedValue(produtoExemplo);
      vi.mocked(pedidoRepositoryMock.criar).mockImplementation(async (pedido) => pedido);

      const criado = await pedidoService.cadastrarPedido({
        produto_id: PRODUTO_ID_VALIDO,
        quantidade_solicitada: 50,
        fornecedor: 'Fornecedor Alpha',
        observacoes: 'Reposição mensal',
      });

      expect(criado.status).toBe('pendente');
      expect(criado.quantidade_solicitada).toBe(50);
      expect(pedidoRepositoryMock.criar).toHaveBeenCalledTimes(1);
    });

    it('deve rejeitar cadastro de pedido com quantidade_solicitada menor ou igual a zero (HTTP 422)', async () => {
      await expect(
        pedidoService.cadastrarPedido({
          produto_id: PRODUTO_ID_VALIDO,
          quantidade_solicitada: 0,
          fornecedor: 'Fornecedor Alpha',
        })
      ).rejects.toMatchObject({
        statusCode: 422,
      });
    });

    it('deve impedir exclusão de pedido já recebido (HTTP 409)', async () => {
      vi.mocked(pedidoRepositoryMock.buscarPorId).mockResolvedValue({
        ...pedidoPendenteExemplo,
        status: 'recebido',
      });

      await expect(
        pedidoService.excluirPedido(PEDIDO_ID_VALIDO)
      ).rejects.toMatchObject({
        statusCode: 409,
      });

      expect(pedidoRepositoryMock.excluir).not.toHaveBeenCalled();
    });

    it('deve permitir exclusão de pedido pendente', async () => {
      vi.mocked(pedidoRepositoryMock.buscarPorId).mockResolvedValue(pedidoPendenteExemplo);
      vi.mocked(pedidoRepositoryMock.excluir).mockResolvedValue();

      await pedidoService.excluirPedido(PEDIDO_ID_VALIDO);

      expect(pedidoRepositoryMock.excluir).toHaveBeenCalledWith(PEDIDO_ID_VALIDO);
    });
  });
});
