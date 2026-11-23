import { NextFunction, Request, Response } from 'express';
import { CategoriaService } from '../services/categoria.service';

export class CategoriaController {
  private readonly categoriaService: CategoriaService;

  constructor(categoriaService: CategoriaService) {
    this.categoriaService = categoriaService;
  }

  public listar = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const categorias = await this.categoriaService.listarCategorias();
      res.status(200).json(categorias);
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
      const categoria = await this.categoriaService.buscarCategoriaPorId(req.params.id);
      res.status(200).json(categoria);
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
      const categoria = await this.categoriaService.cadastrarCategoria(req.body);
      res.status(201).json(categoria);
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
      const categoria = await this.categoriaService.atualizarCategoria(
        req.params.id,
        req.body
      );
      res.status(200).json(categoria);
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
      await this.categoriaService.excluirCategoria(req.params.id);
      res.status(204).send();
    } catch (erro) {
      next(erro);
    }
  };
}
