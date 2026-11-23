import { Router } from 'express';
import { CategoriaController } from '../controllers/categoria.controller';
import { CategoriaRepository } from '../repositories/categoria.repository';
import { CategoriaService } from '../services/categoria.service';

const router = Router();

const categoriaRepository = new CategoriaRepository();
const categoriaService = new CategoriaService(categoriaRepository);
const categoriaController = new CategoriaController(categoriaService);

router.get('/', categoriaController.listar);
router.get('/:id', categoriaController.buscarPorId);
router.post('/', categoriaController.cadastrar);
router.put('/:id', categoriaController.atualizar);
router.delete('/:id', categoriaController.excluir);

export default router;
