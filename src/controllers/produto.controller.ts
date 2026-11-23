import { NextFunction, Request, Response } from 'express';
import { ProdutoService } from '../services/produto.service';

export class ProdutoController {
  private readonly produtoService: ProdutoService;

  constructor(produtoService: ProdutoService) {
    this.produtoService = produtoService;
  }

  public listar = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const categoriaId =
        typeof req.query.categoria_id === 'string' ? req.query.categoria_id : undefined;
      const estoqueBaixo = req.query.estoque_baixo === 'true';

      const produtos = await this.produtoService.listarProdutos({
        categoria_id: categoriaId,
        estoque_baixo: estoqueBaixo,
      });

      res.status(200).json(produtos);
    } catch (erro) {
      next(erro);
    }
  };

  public buscarPorId = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const produto = await this.produtoService.buscarProdutoPorId(req.params.id);
      res.status(200).json(produto);
    } catch (erro) {
      next(erro);
    }
  };

  public cadastrar = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const produto = await this.produtoService.cadastrarProduto(req.body);
      res.status(201).json(produto);
    } catch (erro) {
      next(erro);
    }
  };

  public atualizar = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const produto = await this.produtoService.atualizarProduto(req.params.id, req.body);
      res.status(200).json(produto);
    } catch (erro) {
      next(erro);
    }
  };

  public movimentarEstoque = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const produto = await this.produtoService.movimentarEstoque(
        req.params.id,
        req.body?.variacao
      );
      res.status(200).json(produto);
    } catch (erro) {
      next(erro);
    }
  };

  public excluir = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.produtoService.excluirProduto(req.params.id);
      res.status(204).send();
    } catch (erro) {
      next(erro);
    }
  };
}
