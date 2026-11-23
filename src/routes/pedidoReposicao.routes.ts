import { Router } from 'express';
import { PedidoReposicaoController } from '../controllers/pedidoReposicao.controller';
import { PedidoReposicaoRepository } from '../repositories/pedidoReposicao.repository';
import { ProdutoRepository } from '../repositories/produto.repository';
import { PedidoReposicaoService } from '../services/pedidoReposicao.service';

const router = Router();

const pedidoRepository = new PedidoReposicaoRepository();
const produtoRepository = new ProdutoRepository();
const pedidoService = new PedidoReposicaoService(pedidoRepository, produtoRepository);
const pedidoController = new PedidoReposicaoController(pedidoService);

router.get('/', pedidoController.listar);
router.get('/:id', pedidoController.buscarPorId);
router.post('/', pedidoController.cadastrar);
router.put('/:id', pedidoController.atualizar);
router.patch('/:id/receber', pedidoController.receber);
router.delete('/:id', pedidoController.excluir);

export default router;
