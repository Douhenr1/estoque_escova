import { v4 as gerarUuid } from 'uuid';
import { AppError } from '../errors/AppError';
import {
  AtualizarProdutoDTO,
  CriarProdutoDTO,
  FiltrosProdutoDTO,
  Produto,
  ProdutoEntidade,
  TIPOS_CERDAS_VALIDOS,
  TipoCerdas,
} from '../models/produto.model';
import { ICategoriaRepository } from '../repositories/categoria.repository';
import { IProdutoRepository } from '../repositories/produto.repository';
import {
  validarBooleano,
  validarInteiro,
  validarInteiroNaoNegativo,
  validarNumeroPositivo,
  validarTextoObrigatorio,
  validarUuid,
} from '../utils/validadores';

export class ProdutoService {
  private readonly produtoRepository: IProdutoRepository;
  private readonly categoriaRepository: ICategoriaRepository;

  constructor(
    produtoRepository: IProdutoRepository,
    categoriaRepository: ICategoriaRepository
  ) {
    this.produtoRepository = produtoRepository;
    this.categoriaRepository = categoriaRepository;
  }

  public async listarProdutos(filtros?: FiltrosProdutoDTO): Promise<Produto[]> {
    const filtrosValidados: FiltrosProdutoDTO = {};

    if (filtros?.categoria_id) {
      filtrosValidados.categoria_id = validarUuid(filtros.categoria_id, 'categoria_id');
    }

    const produtos = await this.produtoRepository.listarTodos(filtrosValidados);

    if (filtros?.estoque_baixo) {
      return produtos.filter((item) => new ProdutoEntidade(item).estaComEstoqueBaixo());
    }

    return produtos;
  }

  public async buscarProdutoPorId(id: string): Promise<Produto> {
    const idValido = validarUuid(id, 'id');
    const produto = await this.produtoRepository.buscarPorId(idValido);

    if (!produto) {
      throw new AppError('Produto não encontrado.', 404);
    }

    return produto;
  }

  public async cadastrarProduto(dados: CriarProdutoDTO): Promise<Produto> {
    if (!dados || typeof dados !== 'object') {
      throw new AppError('Dados do produto são obrigatórios.', 400);
    }

    const categoriaId = validarUuid(dados.categoria_id, 'categoria_id');
    const nome = validarTextoObrigatorio(dados.nome, 'nome', 2);
    const descricao = validarTextoObrigatorio(dados.descricao, 'descricao', 2);
    const tipoCerdas = this.validarTipoCerdas(dados.tipo_cerdas);

    // RN01 — Impedir cadastro com estoque negativo ou não inteiro (HTTP 422)
    if (dados.quantidade_estoque === undefined || dados.quantidade_estoque === null) {
      throw new AppError('O campo "quantidade_estoque" é obrigatório.', 400);
    }
    const quantidadeEstoque = validarInteiroNaoNegativo(
      dados.quantidade_estoque,
      'quantidade_estoque',
      422
    );

    if (dados.estoque_minimo === undefined || dados.estoque_minimo === null) {
      throw new AppError('O campo "estoque_minimo" é obrigatório.', 400);
    }
    const estoqueMinimo = validarInteiroNaoNegativo(
      dados.estoque_minimo,
      'estoque_minimo',
      422
    );

    if (dados.preco_unitario === undefined || dados.preco_unitario === null) {
      throw new AppError('O campo "preco_unitario" é obrigatório.', 400);
    }
    const precoUnitario = validarNumeroPositivo(dados.preco_unitario, 'preco_unitario', 422);

    const ativo =
      dados.ativo !== undefined ? validarBooleano(dados.ativo, 'ativo') : true;

    const categoria = await this.categoriaRepository.buscarPorId(categoriaId);
    if (!categoria) {
      throw new AppError('Categoria informada não encontrada.', 404);
    }

    const novoProduto = new ProdutoEntidade({
      id: gerarUuid(),
      categoria_id: categoriaId,
      nome,
      descricao,
      tipo_cerdas: tipoCerdas,
      quantidade_estoque: quantidadeEstoque,
      estoque_minimo: estoqueMinimo,
      preco_unitario: precoUnitario,
      ativo,
    });

    return this.produtoRepository.criar(novoProduto.paraObjeto());
  }

  public async atualizarProduto(
    id: string,
    dados: AtualizarProdutoDTO
  ): Promise<Produto> {
    const idValido = validarUuid(id, 'id');

    if (!dados || typeof dados !== 'object' || Object.keys(dados).length === 0) {
      throw new AppError('Nenhum campo fornecido para atualização.', 400);
    }

    const dadosAtualizacao: AtualizarProdutoDTO = {};

    if (dados.categoria_id !== undefined) {
      const categoriaId = validarUuid(dados.categoria_id, 'categoria_id');
      const categoria = await this.categoriaRepository.buscarPorId(categoriaId);
      if (!categoria) {
        throw new AppError('Categoria informada não encontrada.', 404);
      }
      dadosAtualizacao.categoria_id = categoriaId;
    }

    if (dados.nome !== undefined) {
      dadosAtualizacao.nome = validarTextoObrigatorio(dados.nome, 'nome', 2);
    }

    if (dados.descricao !== undefined) {
      dadosAtualizacao.descricao = validarTextoObrigatorio(dados.descricao, 'descricao', 2);
    }

    if (dados.tipo_cerdas !== undefined) {
      dadosAtualizacao.tipo_cerdas = this.validarTipoCerdas(dados.tipo_cerdas);
    }

    // RN01 — Impedir atualização que defina estoque negativo ou não inteiro (HTTP 422)
    if (dados.quantidade_estoque !== undefined) {
      dadosAtualizacao.quantidade_estoque = validarInteiroNaoNegativo(
        dados.quantidade_estoque,
        'quantidade_estoque',
        422
      );
    }

    if (dados.estoque_minimo !== undefined) {
      dadosAtualizacao.estoque_minimo = validarInteiroNaoNegativo(
        dados.estoque_minimo,
        'estoque_minimo',
        422
      );
    }

    if (dados.preco_unitario !== undefined) {
      dadosAtualizacao.preco_unitario = validarNumeroPositivo(
        dados.preco_unitario,
        'preco_unitario',
        422
      );
    }

    if (dados.ativo !== undefined) {
      dadosAtualizacao.ativo = validarBooleano(dados.ativo, 'ativo');
    }

    if (Object.keys(dadosAtualizacao).length === 0) {
      throw new AppError('Nenhum campo válido fornecido para atualização.', 400);
    }

    const produtoExistente = await this.produtoRepository.buscarPorId(idValido);
    if (!produtoExistente) {
      throw new AppError('Produto não encontrado.', 404);
    }

    const produtoAtualizado = await this.produtoRepository.atualizar(
      idValido,
      dadosAtualizacao
    );

    if (!produtoAtualizado) {
      throw new AppError('Produto não encontrado.', 404);
    }

    return produtoAtualizado;
  }

  /**
   * RN01 — Movimenta o estoque (entrada positiva ou saída negativa) impedindo saldo inferior a zero.
   */
  public async movimentarEstoque(id: string, variacao: number): Promise<Produto> {
    const idValido = validarUuid(id, 'id');
    const variacaoValida = validarInteiro(variacao, 'variacao', 422);

    if (variacaoValida === 0) {
      throw new AppError('A variação de estoque deve ser diferente de zero.', 422);
    }

    const produtoExistente = await this.produtoRepository.buscarPorId(idValido);
    if (!produtoExistente) {
      throw new AppError('Produto não encontrado.', 404);
    }

    const entidade = new ProdutoEntidade(produtoExistente);
    if (!entidade.podeMovimentarEstoque(variacaoValida)) {
      throw new AppError(
        `Operação rejeitada: estoque insuficiente. Estoque atual: ${entidade.quantidade_estoque} unidade(s).`,
        422
      );
    }

    const novoEstoque = entidade.quantidade_estoque + variacaoValida;
    const produtoAtualizado = await this.produtoRepository.atualizar(idValido, {
      quantidade_estoque: novoEstoque,
    });

    if (!produtoAtualizado) {
      throw new AppError('Produto não encontrado.', 404);
    }

    return produtoAtualizado;
  }

  /**
   * RN03 — Impede exclusão de produto vinculado a pedidos de reposição (HTTP 409).
   */
  public async excluirProduto(id: string): Promise<void> {
    const idValido = validarUuid(id, 'id');

    const produtoExistente = await this.produtoRepository.buscarPorId(idValido);
    if (!produtoExistente) {
      throw new AppError('Produto não encontrado.', 404);
    }

    const possuiPedidos = await this.produtoRepository.possuiPedidosVinculados(idValido);
    if (possuiPedidos) {
      throw new AppError(
        'Não é possível excluir um produto que possui pedidos de reposição vinculados.',
        409
      );
    }

    await this.produtoRepository.excluir(idValido);
  }

  private validarTipoCerdas(valor: unknown): TipoCerdas {
    if (
      typeof valor !== 'string' ||
      !TIPOS_CERDAS_VALIDOS.includes(valor as TipoCerdas)
    ) {
      throw new AppError(
        `Tipo de cerdas inválido. Valores aceitos: ${TIPOS_CERDAS_VALIDOS.join(', ')}.`,
        422
      );
    }
    return valor as TipoCerdas;
  }
}
