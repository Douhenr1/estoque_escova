import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { AppError } from '../errors/AppError';
import {
  AtualizarPedidoReposicaoDTO,
  FiltrosPedidoReposicaoDTO,
  PedidoReposicao,
} from '../models/pedidoReposicao.model';

export interface IPedidoReposicaoRepository {
  listarTodos(filtros?: FiltrosPedidoReposicaoDTO): Promise<PedidoReposicao[]>;
  buscarPorId(id: string): Promise<PedidoReposicao | null>;
  criar(pedido: PedidoReposicao): Promise<PedidoReposicao>;
  atualizar(id: string, dados: AtualizarPedidoReposicaoDTO): Promise<PedidoReposicao | null>;
  excluir(id: string): Promise<void>;
  receberPedidoTransacional(id: string, quantidadeRecebida: number): Promise<PedidoReposicao>;
}

export class PedidoReposicaoRepository implements IPedidoReposicaoRepository {
  private readonly cliente: SupabaseClient;

  constructor(cliente: SupabaseClient = supabase) {
    this.cliente = cliente;
  }

  public async listarTodos(filtros?: FiltrosPedidoReposicaoDTO): Promise<PedidoReposicao[]> {
    let consulta = this.cliente
      .from('pedidos_reposicao')
      .select('*, produtos(nome, quantidade_estoque, estoque_minimo)')
      .order('created_at', { ascending: false });

    if (filtros?.status) {
      consulta = consulta.eq('status', filtros.status);
    }

    if (filtros?.produto_id) {
      consulta = consulta.eq('produto_id', filtros.produto_id);
    }

    const { data, error } = await consulta;

    if (error) {
      throw new AppError('Não foi possível listar os pedidos de reposição.', 500);
    }

    return (data ?? []) as PedidoReposicao[];
  }

  public async buscarPorId(id: string): Promise<PedidoReposicao | null> {
    const { data, error } = await this.cliente
      .from('pedidos_reposicao')
      .select('*, produtos(nome, quantidade_estoque, estoque_minimo)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new AppError('Não foi possível consultar o pedido de reposição.', 500);
    }

    return (data as PedidoReposicao | null) ?? null;
  }

  public async criar(pedido: PedidoReposicao): Promise<PedidoReposicao> {
    const { data, error } = await this.cliente
      .from('pedidos_reposicao')
      .insert({
        id: pedido.id,
        produto_id: pedido.produto_id,
        quantidade_solicitada: pedido.quantidade_solicitada,
        fornecedor: pedido.fornecedor,
        observacoes: pedido.observacoes ?? null,
        status: pedido.status,
        data_solicitacao: pedido.data_solicitacao,
      })
      .select()
      .single();

    if (error || !data) {
      if (error?.code === '23503') {
        throw new AppError('Produto informado não encontrado.', 404);
      }
      throw new AppError('Não foi possível cadastrar o pedido de reposição.', 500);
    }

    return data as PedidoReposicao;
  }

  public async atualizar(
    id: string,
    dados: AtualizarPedidoReposicaoDTO
  ): Promise<PedidoReposicao | null> {
    const { data, error } = await this.cliente
      .from('pedidos_reposicao')
      .update({
        ...dados,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new AppError('Não foi possível atualizar o pedido de reposição.', 500);
    }

    return (data as PedidoReposicao | null) ?? null;
  }

  public async excluir(id: string): Promise<void> {
    const { error } = await this.cliente
      .from('pedidos_reposicao')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError('Não foi possível excluir o pedido de reposição.', 500);
    }
  }

  public async receberPedidoTransacional(
    id: string,
    quantidadeRecebida: number
  ): Promise<PedidoReposicao> {
    const { data, error } = await this.cliente.rpc('receber_pedido_reposicao', {
      p_pedido_id: id,
      p_quantidade_recebida: quantidadeRecebida,
    });

    if (error) {
      const mensagem = error.message || '';

      if (mensagem.includes('PEDIDO_NAO_ENCONTRADO')) {
        throw new AppError('Pedido de reposição não encontrado.', 404);
      }
      if (mensagem.includes('PEDIDO_JA_RECEBIDO')) {
        throw new AppError('Este pedido de reposição já foi recebido anteriormente.', 409);
      }
      if (mensagem.includes('PEDIDO_CANCELADO')) {
        throw new AppError('Não é possível receber um pedido cancelado.', 409);
      }
      if (mensagem.includes('PEDIDO_STATUS_INVALIDO')) {
        throw new AppError('Somente pedidos com status pendente podem ser recebidos.', 409);
      }
      if (mensagem.includes('QUANTIDADE_INVALIDA')) {
        throw new AppError(
          'A quantidade recebida deve ser um número inteiro positivo.',
          422
        );
      }
      if (mensagem.includes('PRODUTO_NAO_ENCONTRADO')) {
        throw new AppError('Produto vinculado ao pedido não foi encontrado.', 404);
      }

      throw new AppError('Não foi possível concluir o recebimento do pedido de reposição.', 500);
    }

    const pedidoAtualizado = Array.isArray(data) ? data[0] : data;

    if (!pedidoAtualizado) {
      throw new AppError('Não foi possível confirmar o recebimento do pedido de reposição.', 500);
    }

    return pedidoAtualizado as PedidoReposicao;
  }
}
