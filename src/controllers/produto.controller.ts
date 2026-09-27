import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CreateProdutoDTO, UpdateProdutoDTO } from '../models/produto.model';
import { v4 as uuidv4 } from 'uuid';

const tiposCerdasValidos = ['macia', 'media', 'dura'];

export const produtoController = {

  // GET /produtos
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const { categoria_id, estoque_baixo } = req.query;

      let query = supabase
        .from('produtos')
        .select('*, categorias(nome)')
        .order('nome', { ascending: true });

      if (categoria_id) {
        query = query.eq('categoria_id', categoria_id as string);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtro de estoque baixo (quantidade <= estoque_minimo)
      if (estoque_baixo === 'true') {
        const baixo = data.filter((p: any) => p.quantidade_estoque <= p.estoque_minimo);
        res.status(200).json(baixo);
        return;
      }

      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao listar produtos.', detalhe: error.message });
    }
  },

  // GET /produtos/:id
  async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('produtos')
        .select('*, categorias(nome)')
        .eq('id', id)
        .single();

      if (error || !data) {
        res.status(404).json({ erro: 'Produto não encontrado.' });
        return;
      }

      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao buscar produto.', detalhe: error.message });
    }
  },

  // POST /produtos
  async criar(req: Request, res: Response): Promise<void> {
    try {
      const {
        categoria_id,
        nome,
        descricao,
        tipo_cerdas,
        quantidade_estoque,
        estoque_minimo,
        preco_unitario,
        ativo,
      }: CreateProdutoDTO = req.body;

      // Validações obrigatórias
      if (!categoria_id || !nome || !descricao || !tipo_cerdas) {
        res.status(400).json({
          erro: 'Os campos "categoria_id", "nome", "descricao" e "tipo_cerdas" são obrigatórios.',
        });
        return;
      }

      if (!tiposCerdasValidos.includes(tipo_cerdas)) {
        res.status(400).json({
          erro: `Tipo de cerdas inválido. Valores aceitos: ${tiposCerdasValidos.join(', ')}.`,
        });
        return;
      }

      if (quantidade_estoque === undefined || quantidade_estoque < 0) {
        res.status(400).json({ erro: '"quantidade_estoque" deve ser um número maior ou igual a 0.' });
        return;
      }

      if (estoque_minimo === undefined || estoque_minimo < 0) {
        res.status(400).json({ erro: '"estoque_minimo" deve ser um número maior ou igual a 0.' });
        return;
      }

      if (!preco_unitario || preco_unitario <= 0) {
        res.status(400).json({ erro: '"preco_unitario" deve ser um número positivo.' });
        return;
      }

      // Verifica se a categoria existe
      const { data: categoria } = await supabase
        .from('categorias')
        .select('id')
        .eq('id', categoria_id)
        .single();

      if (!categoria) {
        res.status(404).json({ erro: 'Categoria informada não encontrada.' });
        return;
      }

      const novoProduto = {
        id: uuidv4(),
        categoria_id,
        nome: nome.trim(),
        descricao: descricao.trim(),
        tipo_cerdas,
        quantidade_estoque,
        estoque_minimo,
        preco_unitario,
        ativo: ativo !== undefined ? ativo : true,
      };

      const { data, error } = await supabase
        .from('produtos')
        .insert(novoProduto)
        .select()
        .single();

      if (error) throw error;

      res.status(201).json(data);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao criar produto.', detalhe: error.message });
    }
  },

  // PUT /produtos/:id
  async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateProdutoDTO = req.body;

      if (Object.keys(updates).length === 0) {
        res.status(400).json({ erro: 'Nenhum campo fornecido para atualização.' });
        return;
      }

      if (updates.tipo_cerdas && !tiposCerdasValidos.includes(updates.tipo_cerdas)) {
        res.status(400).json({
          erro: `Tipo de cerdas inválido. Valores aceitos: ${tiposCerdasValidos.join(', ')}.`,
        });
        return;
      }

      if (updates.preco_unitario !== undefined && updates.preco_unitario <= 0) {
        res.status(400).json({ erro: '"preco_unitario" deve ser um número positivo.' });
        return;
      }

      if (updates.quantidade_estoque !== undefined && updates.quantidade_estoque < 0) {
        res.status(400).json({ erro: '"quantidade_estoque" não pode ser negativo.' });
        return;
      }

      const { data, error } = await supabase
        .from('produtos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        res.status(404).json({ erro: 'Produto não encontrado.' });
        return;
      }

      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao atualizar produto.', detalhe: error.message });
    }
  },

  // DELETE /produtos/:id
  async deletar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verifica se existem pedidos vinculados
      const { data: pedidos } = await supabase
        .from('pedidos_reposicao')
        .select('id')
        .eq('produto_id', id)
        .limit(1);

      if (pedidos && pedidos.length > 0) {
        res.status(409).json({
          erro: 'Não é possível excluir um produto com pedidos de reposição vinculados.',
        });
        return;
      }

      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao deletar produto.', detalhe: error.message });
    }
  },
};
