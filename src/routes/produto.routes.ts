import { Router } from 'express';
import { ProdutoController } from '../controllers/produto.controller';
import { CategoriaRepository } from '../repositories/categoria.repository';
import { ProdutoRepository } from '../repositories/produto.repository';
import { ProdutoService } from '../services/produto.service';

const router = Router();

const produtoRepository = new ProdutoRepository();
const categoriaRepository = new CategoriaRepository();
const produtoService = new ProdutoService(produtoRepository, categoriaRepository);
const produtoController = new ProdutoController(produtoService);

router.get('/', produtoController.listar);
router.get('/:id', produtoController.buscarPorId);
router.post('/', produtoController.cadastrar);
router.put('/:id', produtoController.atualizar);
router.patch('/:id/estoque', produtoController.movimentarEstoque);
router.delete('/:id', produtoController.excluir);

export default router;
