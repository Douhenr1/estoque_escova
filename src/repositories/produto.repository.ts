import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { AppError } from '../errors/AppError';
import {
  AtualizarProdutoDTO,
  FiltrosProdutoDTO,
  Produto,
} from '../models/produto.model';

export interface IProdutoRepository {
  listarTodos(filtros?: FiltrosProdutoDTO): Promise<Produto[]>;
  buscarPorId(id: string): Promise<Produto | null>;
  criar(produto: Produto): Promise<Produto>;
  atualizar(id: string, dados: AtualizarProdutoDTO): Promise<Produto | null>;
  excluir(id: string): Promise<void>;
  possuiPedidosVinculados(id: string): Promise<boolean>;
}

export class ProdutoRepository implements IProdutoRepository {
  private readonly cliente: SupabaseClient;

  constructor(cliente: SupabaseClient = supabase) {
    this.cliente = cliente;
  }

  public async listarTodos(filtros?: FiltrosProdutoDTO): Promise<Produto[]> {
    let consulta = this.cliente
      .from('produtos')
      .select('*, categorias(nome)')
      .order('nome', { ascending: true });

    if (filtros?.categoria_id) {
      consulta = consulta.eq('categoria_id', filtros.categoria_id);
    }

    const { data, error } = await consulta;

    if (error) {
      throw new AppError('Não foi possível listar os produtos.', 500);
    }

    return (data ?? []) as Produto[];
  }

  public async buscarPorId(id: string): Promise<Produto | null> {
    const { data, error } = await this.cliente
      .from('produtos')
      .select('*, categorias(nome)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new AppError('Não foi possível consultar o produto.', 500);
    }

    return (data as Produto | null) ?? null;
  }

  public async criar(produto: Produto): Promise<Produto> {
    const { data, error } = await this.cliente
      .from('produtos')
      .insert({
        id: produto.id,
        categoria_id: produto.categoria_id,
        nome: produto.nome,
        descricao: produto.descricao,
        tipo_cerdas: produto.tipo_cerdas,
        quantidade_estoque: produto.quantidade_estoque,
        estoque_minimo: produto.estoque_minimo,
        preco_unitario: produto.preco_unitario,
        ativo: produto.ativo,
      })
      .select()
      .single();

    if (error || !data) {
      if (error?.code === '23514') {
        throw new AppError('Os dados informados violam as restrições de estoque ou preço.', 422);
      }
      if (error?.code === '23503') {
        throw new AppError('Categoria informada não encontrada.', 404);
      }
      throw new AppError('Não foi possível cadastrar o produto.', 500);
    }

    return data as Produto;
  }

  public async atualizar(id: string, dados: AtualizarProdutoDTO): Promise<Produto | null> {
    const { data, error } = await this.cliente
      .from('produtos')
      .update({
        ...dados,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23514') {
        throw new AppError('Os dados informados violam as restrições de estoque ou preço.', 422);
      }
      if (error.code === '23503') {
        throw new AppError('Categoria informada não encontrada.', 404);
      }
      throw new AppError('Não foi possível atualizar o produto.', 500);
    }

    return (data as Produto | null) ?? null;
  }

  public async excluir(id: string): Promise<void> {
    const { error } = await this.cliente
      .from('produtos')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new AppError(
          'Não é possível excluir um produto que possui pedidos de reposição vinculados.',
          409
        );
      }
      throw new AppError('Não foi possível excluir o produto.', 500);
    }
  }

  public async possuiPedidosVinculados(id: string): Promise<boolean> {
    const { data, error } = await this.cliente
      .from('pedidos_reposicao')
      .select('id')
      .eq('produto_id', id)
      .limit(1);

    if (error) {
      throw new AppError('Não foi possível verificar os pedidos vinculados ao produto.', 500);
    }

    return Boolean(data && data.length > 0);
  }
}
