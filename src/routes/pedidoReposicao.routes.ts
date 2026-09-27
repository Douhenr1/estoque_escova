import { Router } from 'express';
import { pedidoReposicaoController } from '../controllers/pedidoReposicao.controller';

const router = Router();

router.get('/', pedidoReposicaoController.listar);
router.get('/:id', pedidoReposicaoController.buscarPorId);
router.post('/', pedidoReposicaoController.criar);
router.put('/:id', pedidoReposicaoController.atualizar);
router.delete('/:id', pedidoReposicaoController.deletar);

export default router;
