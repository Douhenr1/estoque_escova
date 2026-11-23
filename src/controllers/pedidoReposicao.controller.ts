import { NextFunction, Request, Response } from 'express';
import { StatusPedidoReposicao } from '../models/pedidoReposicao.model';
import { PedidoReposicaoService } from '../services/pedidoReposicao.service';

export class PedidoReposicaoController {
  private readonly pedidoService: PedidoReposicaoService;

  constructor(pedidoService: PedidoReposicaoService) {
    this.pedidoService = pedidoService;
  }

  public listar = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const status =
        typeof req.query.status === 'string'
          ? (req.query.status as StatusPedidoReposicao)
          : undefined;
      const produtoId =
        typeof req.query.produto_id === 'string' ? req.query.produto_id : undefined;

      const pedidos = await this.pedidoService.listarPedidos({
        status,
        produto_id: produtoId,
      });

      res.status(200).json(pedidos);
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
      const pedido = await this.pedidoService.buscarPedidoPorId(req.params.id);
      res.status(200).json(pedido);
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
      const pedido = await this.pedidoService.cadastrarPedido(req.body);
      res.status(201).json(pedido);
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
      const pedido = await this.pedidoService.atualizarPedido(req.params.id, req.body);
      res.status(200).json(pedido);
    } catch (erro) {
      next(erro);
    }
  };

  public receber = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const pedido = await this.pedidoService.receberPedido(
        req.params.id,
        req.body?.quantidade_recebida
      );
      res.status(200).json(pedido);
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
      await this.pedidoService.excluirPedido(req.params.id);
      res.status(204).send();
    } catch (erro) {
      next(erro);
    }
  };
}
