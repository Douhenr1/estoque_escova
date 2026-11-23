import { v4 as gerarUuid } from 'uuid';
import { AppError } from '../errors/AppError';
import {
  AtualizarCategoriaDTO,
  Categoria,
  CategoriaEntidade,
  CriarCategoriaDTO,
} from '../models/categoria.model';
import { ICategoriaRepository } from '../repositories/categoria.repository';
import {
  validarBooleano,
  validarTextoObrigatorio,
  validarUuid,
} from '../utils/validadores';

export class CategoriaService {
  private readonly categoriaRepository: ICategoriaRepository;

  constructor(categoriaRepository: ICategoriaRepository) {
    this.categoriaRepository = categoriaRepository;
  }

  public async listarCategorias(): Promise<Categoria[]> {
    return this.categoriaRepository.listarTodas();
  }

  public async buscarCategoriaPorId(id: string): Promise<Categoria> {
    const idValido = validarUuid(id, 'id');
    const categoria = await this.categoriaRepository.buscarPorId(idValido);

    if (!categoria) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    return categoria;
  }

  public async cadastrarCategoria(dados: CriarCategoriaDTO): Promise<Categoria> {
    const nome = validarTextoObrigatorio(dados?.nome, 'nome', 2);
    const descricao = validarTextoObrigatorio(dados?.descricao, 'descricao', 2);
    const ativo =
      dados?.ativo !== undefined ? validarBooleano(dados.ativo, 'ativo') : true;

    const novaCategoria = new CategoriaEntidade({
      id: gerarUuid(),
      nome,
      descricao,
      ativo,
    });

    return this.categoriaRepository.criar(novaCategoria.paraObjeto());
  }

  public async atualizarCategoria(
    id: string,
    dados: AtualizarCategoriaDTO
  ): Promise<Categoria> {
    const idValido = validarUuid(id, 'id');

    if (!dados || typeof dados !== 'object' || Object.keys(dados).length === 0) {
      throw new AppError('Nenhum campo fornecido para atualização.', 400);
    }

    const dadosAtualizacao: AtualizarCategoriaDTO = {};

    if (dados.nome !== undefined) {
      dadosAtualizacao.nome = validarTextoObrigatorio(dados.nome, 'nome', 2);
    }

    if (dados.descricao !== undefined) {
      dadosAtualizacao.descricao = validarTextoObrigatorio(dados.descricao, 'descricao', 2);
    }

    if (dados.ativo !== undefined) {
      dadosAtualizacao.ativo = validarBooleano(dados.ativo, 'ativo');
    }

    if (Object.keys(dadosAtualizacao).length === 0) {
      throw new AppError('Nenhum campo válido fornecido para atualização.', 400);
    }

    const categoriaExistente = await this.categoriaRepository.buscarPorId(idValido);
    if (!categoriaExistente) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    const categoriaAtualizada = await this.categoriaRepository.atualizar(
      idValido,
      dadosAtualizacao
    );

    if (!categoriaAtualizada) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    return categoriaAtualizada;
  }

  public async excluirCategoria(id: string): Promise<void> {
    const idValido = validarUuid(id, 'id');

    const categoriaExistente = await this.categoriaRepository.buscarPorId(idValido);
    if (!categoriaExistente) {
      throw new AppError('Categoria não encontrada.', 404);
    }

    const possuiProdutos = await this.categoriaRepository.possuiProdutosVinculados(idValido);
    if (possuiProdutos) {
      throw new AppError(
        'Não é possível excluir uma categoria que possui produtos vinculados.',
        409
      );
    }

    await this.categoriaRepository.excluir(idValido);
  }
}
