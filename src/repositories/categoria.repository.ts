import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { AppError } from '../errors/AppError';
import { AtualizarCategoriaDTO, Categoria } from '../models/categoria.model';

export interface ICategoriaRepository {
  listarTodas(): Promise<Categoria[]>;
  buscarPorId(id: string): Promise<Categoria | null>;
  criar(categoria: Categoria): Promise<Categoria>;
  atualizar(id: string, dados: AtualizarCategoriaDTO): Promise<Categoria | null>;
  excluir(id: string): Promise<void>;
  possuiProdutosVinculados(id: string): Promise<boolean>;
}

export class CategoriaRepository implements ICategoriaRepository {
  private readonly cliente: SupabaseClient;

  constructor(cliente: SupabaseClient = supabase) {
    this.cliente = cliente;
  }

  public async listarTodas(): Promise<Categoria[]> {
    const { data, error } = await this.cliente
      .from('categorias')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      throw new AppError('Não foi possível listar as categorias.', 500);
    }

    return (data ?? []) as Categoria[];
  }

  public async buscarPorId(id: string): Promise<Categoria | null> {
    const { data, error } = await this.cliente
      .from('categorias')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new AppError('Não foi possível consultar a categoria.', 500);
    }

    return (data as Categoria | null) ?? null;
  }

  public async criar(categoria: Categoria): Promise<Categoria> {
    const { data, error } = await this.cliente
      .from('categorias')
      .insert({
        id: categoria.id,
        nome: categoria.nome,
        descricao: categoria.descricao,
        ativo: categoria.ativo,
      })
      .select()
      .single();

    if (error || !data) {
      throw new AppError('Não foi possível cadastrar a categoria.', 500);
    }

    return data as Categoria;
  }

  public async atualizar(id: string, dados: AtualizarCategoriaDTO): Promise<Categoria | null> {
    const { data, error } = await this.cliente
      .from('categorias')
      .update({
        ...dados,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new AppError('Não foi possível atualizar a categoria.', 500);
    }

    return (data as Categoria | null) ?? null;
  }

  public async excluir(id: string): Promise<void> {
    const { error } = await this.cliente
      .from('categorias')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new AppError(
          'Não é possível excluir uma categoria que possui produtos vinculados.',
          409
        );
      }
      throw new AppError('Não foi possível excluir a categoria.', 500);
    }
  }

  public async possuiProdutosVinculados(id: string): Promise<boolean> {
    const { data, error } = await this.cliente
      .from('produtos')
      .select('id')
      .eq('categoria_id', id)
      .limit(1);

    if (error) {
      throw new AppError('Não foi possível verificar os produtos vinculados à categoria.', 500);
    }

    return Boolean(data && data.length > 0);
  }
}
