import { v4 as gerarUuid } from 'uuid';
import { AppError } from '../errors/AppError';
import {
  AtualizarPedidoReposicaoDTO,
  CriarPedidoReposicaoDTO,
  FiltrosPedidoReposicaoDTO,
  PedidoReposicao,
  PedidoReposicaoEntidade,
  STATUS_PEDIDO_VALIDOS,
  StatusPedidoReposicao,
} from '../models/pedidoReposicao.model';
import { IPedidoReposicaoRepository } from '../repositories/pedidoReposicao.repository';
import { IProdutoRepository } from '../repositories/produto.repository';
import {
  validarInteiroPositivo,
  validarTextoObrigatorio,
  validarTextoOpcional,
  validarUuid,
} from '../utils/validadores';

export class PedidoReposicaoService {
  private readonly pedidoRepository: IPedidoReposicaoRepository;
  private readonly produtoRepository: IProdutoRepository;

  constructor(
    pedidoRepository: IPedidoReposicaoRepository,
    produtoRepository: IProdutoRepository
  ) {
    this.pedidoRepository = pedidoRepository;
    this.produtoRepository = produtoRepository;
  }

  public async listarPedidos(
    filtros?: FiltrosPedidoReposicaoDTO
  ): Promise<PedidoReposicao[]> {
    const filtrosValidados: FiltrosPedidoReposicaoDTO = {};

    if (filtros?.status) {
      filtrosValidados.status = this.validarStatus(filtros.status);
    }

    if (filtros?.produto_id) {
      filtrosValidados.produto_id = validarUuid(filtros.produto_id, 'produto_id');
    }

    return this.pedidoRepository.listarTodos(filtrosValidados);
  }

  public async buscarPedidoPorId(id: string): Promise<PedidoReposicao> {
    const idValido = validarUuid(id, 'id');
    const pedido = await this.pedidoRepository.buscarPorId(idValido);

    if (!pedido) {
      throw new AppError('Pedido de reposição não encontrado.', 404);
    }

    return pedido;
  }

  public async cadastrarPedido(dados: CriarPedidoReposicaoDTO): Promise<PedidoReposicao> {
    if (!dados || typeof dados !== 'object') {
      throw new AppError('Dados do pedido de reposição são obrigatórios.', 400);
    }

    const produtoId = validarUuid(dados.produto_id, 'produto_id');

    if (
      dados.quantidade_solicitada === undefined ||
      dados.quantidade_solicitada === null
    ) {
      throw new AppError('O campo "quantidade_solicitada" é obrigatório.', 400);
    }

    const quantidadeSolicitada = validarInteiroPositivo(
      dados.quantidade_solicitada,
      'quantidade_solicitada',
      422
    );

    const fornecedor = validarTextoObrigatorio(dados.fornecedor, 'fornecedor', 2);
    const observacoes = validarTextoOpcional(dados.observacoes, 'observacoes');

    const produto = await this.produtoRepository.buscarPorId(produtoId);
    if (!produto) {
      throw new AppError('Produto informado não encontrado.', 404);
    }

    const novoPedido: PedidoReposicao = {
      id: gerarUuid(),
      produto_id: produtoId,
      quantidade_solicitada: quantidadeSolicitada,
      fornecedor,
      observacoes,
      status: 'pendente',
      data_solicitacao: new Date().toISOString(),
    };

    return this.pedidoRepository.criar(novoPedido);
  }

  /**
   * RN02 — Recebe um pedido de reposição de forma atômica e única.
   * Somente pedidos com status "pendente" podem ser recebidos (HTTP 409 em caso de conflito).
   */
  public async receberPedido(
    id: string,
    quantidadeRecebida?: number
  ): Promise<PedidoReposicao> {
    const idValido = validarUuid(id, 'id');

    if (quantidadeRecebida !== undefined && quantidadeRecebida !== null) {
      validarInteiroPositivo(quantidadeRecebida, 'quantidade_recebida', 422);
    }

    const pedidoAtual = await this.pedidoRepository.buscarPorId(idValido);
    if (!pedidoAtual) {
      throw new AppError('Pedido de reposição não encontrado.', 404);
    }

    const entidade = new PedidoReposicaoEntidade(pedidoAtual);

    if (entidade.status === 'recebido') {
      throw new AppError('Este pedido de reposição já foi recebido anteriormente.', 409);
    }

    if (entidade.status === 'cancelado') {
      throw new AppError('Não é possível receber um pedido cancelado.', 409);
    }

    if (!entidade.podeSerRecebido()) {
      throw new AppError('Somente pedidos com status pendente podem ser recebidos.', 409);
    }

    const quantidadeFinal =
      quantidadeRecebida !== undefined && quantidadeRecebida !== null
        ? quantidadeRecebida
        : entidade.quantidade_solicitada;

    return this.pedidoRepository.receberPedidoTransacional(idValido, quantidadeFinal);
  }

  public async atualizarPedido(
    id: string,
    dados: AtualizarPedidoReposicaoDTO
  ): Promise<PedidoReposicao> {
    const idValido = validarUuid(id, 'id');

    if (!dados || typeof dados !== 'object' || Object.keys(dados).length === 0) {
      throw new AppError('Nenhum campo fornecido para atualização.', 400);
    }

    if (dados.status !== undefined) {
      this.validarStatus(dados.status);
    }

    const pedidoAtual = await this.pedidoRepository.buscarPorId(idValido);
    if (!pedidoAtual) {
      throw new AppError('Pedido de reposição não encontrado.', 404);
    }

    const entidade = new PedidoReposicaoEntidade(pedidoAtual);

    if (entidade.status === 'recebido') {
      throw new AppError('Não é possível alterar um pedido já recebido.', 409);
    }

    if (entidade.status === 'cancelado') {
      throw new AppError('Não é possível alterar um pedido cancelado.', 409);
    }

    // RN02 — Caso a atualização solicite o recebimento, delega ao fluxo transacional seguro
    if (dados.status === 'recebido') {
      return this.receberPedido(idValido, dados.quantidade_recebida);
    }

    const dadosAtualizacao: AtualizarPedidoReposicaoDTO = {};

    if (dados.quantidade_solicitada !== undefined) {
      dadosAtualizacao.quantidade_solicitada = validarInteiroPositivo(
        dados.quantidade_solicitada,
        'quantidade_solicitada',
        422
      );
    }

    if (dados.fornecedor !== undefined) {
      dadosAtualizacao.fornecedor = validarTextoObrigatorio(
        dados.fornecedor,
        'fornecedor',
        2
      );
    }

    if (dados.observacoes !== undefined) {
      const obs = validarTextoOpcional(dados.observacoes, 'observacoes');
      dadosAtualizacao.observacoes = obs ?? undefined;
    }

    if (dados.status !== undefined) {
      dadosAtualizacao.status = dados.status;
    }

    if (Object.keys(dadosAtualizacao).length === 0) {
      throw new AppError('Nenhum campo válido fornecido para atualização.', 400);
    }

    const pedidoAtualizado = await this.pedidoRepository.atualizar(
      idValido,
      dadosAtualizacao
    );

    if (!pedidoAtualizado) {
      throw new AppError('Pedido de reposição não encontrado.', 404);
    }

    return pedidoAtualizado;
  }

  public async excluirPedido(id: string): Promise<void> {
    const idValido = validarUuid(id, 'id');

    const pedido = await this.pedidoRepository.buscarPorId(idValido);
    if (!pedido) {
      throw new AppError('Pedido de reposição não encontrado.', 404);
    }

    const entidade = new PedidoReposicaoEntidade(pedido);
    if (!entidade.podeSerExcluido()) {
      throw new AppError('Não é possível excluir um pedido já recebido.', 409);
    }

    await this.pedidoRepository.excluir(idValido);
  }

  private validarStatus(valor: unknown): StatusPedidoReposicao {
    if (
      typeof valor !== 'string' ||
      !STATUS_PEDIDO_VALIDOS.includes(valor as StatusPedidoReposicao)
    ) {
      throw new AppError(
        `Status inválido. Valores aceitos: ${STATUS_PEDIDO_VALIDOS.join(', ')}.`,
        422
      );
    }
    return valor as StatusPedidoReposicao;
  }
}
