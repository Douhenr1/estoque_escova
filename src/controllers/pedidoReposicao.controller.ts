import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CreatePedidoReposicaoDTO, UpdatePedidoReposicaoDTO } from '../models/pedidoReposicao.model';
import { v4 as uuidv4 } from 'uuid';

const statusValidos = ['pendente', 'aprovado', 'recebido', 'cancelado'];

export const pedidoReposicaoController = {

  // GET /pedidos-reposicao
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const { status, produto_id } = req.query;

      let query = supabase
        .from('pedidos_reposicao')
        .select('*, produtos(nome, quantidade_estoque, estoque_minimo)')
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status as string);
      if (produto_id) query = query.eq('produto_id', produto_id as string);

      const { data, error } = await query;
      if (error) throw error;

      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao listar pedidos de reposição.', detalhe: error.message });
    }
  },

  // GET /pedidos-reposicao/:id
  async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('pedidos_reposicao')
        .select('*, produtos(nome, quantidade_estoque, estoque_minimo)')
        .eq('id', id)
        .single();

      if (error || !data) {
        res.status(404).json({ erro: 'Pedido de reposição não encontrado.' });
        return;
      }

      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao buscar pedido.', detalhe: error.message });
    }
  },

  // POST /pedidos-reposicao
  async criar(req: Request, res: Response): Promise<void> {
    try {
      const { produto_id, quantidade_solicitada, fornecedor, observacoes }: CreatePedidoReposicaoDTO = req.body;

      if (!produto_id || !quantidade_solicitada || !fornecedor) {
        res.status(400).json({
          erro: 'Os campos "produto_id", "quantidade_solicitada" e "fornecedor" são obrigatórios.',
        });
        return;
      }

      if (quantidade_solicitada <= 0) {
        res.status(400).json({ erro: '"quantidade_solicitada" deve ser maior que 0.' });
        return;
      }

      if (fornecedor.trim().length < 2) {
        res.status(400).json({ erro: 'O nome do fornecedor deve ter no mínimo 2 caracteres.' });
        return;
      }

      // Verifica se o produto existe
      const { data: produto } = await supabase
        .from('produtos')
        .select('id')
        .eq('id', produto_id)
        .single();

      if (!produto) {
        res.status(404).json({ erro: 'Produto informado não encontrado.' });
        return;
      }

      const novoPedido = {
        id: uuidv4(),
        produto_id,
        quantidade_solicitada,
        fornecedor: fornecedor.trim(),
        observacoes: observacoes?.trim() || null,
        status: 'pendente',
        data_solicitacao: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('pedidos_reposicao')
        .insert(novoPedido)
        .select()
        .single();

      if (error) throw error;

      res.status(201).json(data);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao criar pedido de reposição.', detalhe: error.message });
    }
  },

  // PUT /pedidos-reposicao/:id
  async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdatePedidoReposicaoDTO = req.body;

      if (Object.keys(updates).length === 0) {
        res.status(400).json({ erro: 'Nenhum campo fornecido para atualização.' });
        return;
      }

      if (updates.status && !statusValidos.includes(updates.status)) {
        res.status(400).json({
          erro: `Status inválido. Valores aceitos: ${statusValidos.join(', ')}.`,
        });
        return;
      }

      // Busca pedido atual para validações de transição de status
      const { data: pedidoAtual } = await supabase
        .from('pedidos_reposicao')
        .select('status, produto_id')
        .eq('id', id)
        .single();

      if (!pedidoAtual) {
        res.status(404).json({ erro: 'Pedido de reposição não encontrado.' });
        return;
      }

      if (pedidoAtual.status === 'cancelado') {
        res.status(409).json({ erro: 'Não é possível alterar um pedido cancelado.' });
        return;
      }

      // Ao marcar como recebido, atualiza o estoque do produto
      if (updates.status === 'recebido' && updates.quantidade_recebida) {
        await supabase.rpc('incrementar_estoque', {
          p_produto_id: pedidoAtual.produto_id,
          p_quantidade: updates.quantidade_recebida,
        });

        updates.data_recebimento = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('pedidos_reposicao')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao atualizar pedido de reposição.', detalhe: error.message });
    }
  },

  // DELETE /pedidos-reposicao/:id
  async deletar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const { data: pedido } = await supabase
        .from('pedidos_reposicao')
        .select('status')
        .eq('id', id)
        .single();

      if (!pedido) {
        res.status(404).json({ erro: 'Pedido de reposição não encontrado.' });
        return;
      }

      if (pedido.status === 'recebido') {
        res.status(409).json({ erro: 'Não é possível excluir um pedido já recebido.' });
        return;
      }

      const { error } = await supabase
        .from('pedidos_reposicao')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao deletar pedido de reposição.', detalhe: error.message });
    }
  },
};
