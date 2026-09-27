import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CreateCategoriaDTO, UpdateCategoriaDTO } from '../models/categoria.model';
import { v4 as uuidv4 } from 'uuid';

export const categoriaController = {

  // GET /categorias
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;

      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao listar categorias.', detalhe: error.message });
    }
  },

  // GET /categorias/:id
  async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        res.status(404).json({ erro: 'Categoria não encontrada.' });
        return;
      }

      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao buscar categoria.', detalhe: error.message });
    }
  },

  // POST /categorias
  async criar(req: Request, res: Response): Promise<void> {
    try {
      const { nome, descricao, ativo }: CreateCategoriaDTO = req.body;

      if (!nome || !descricao) {
        res.status(400).json({ erro: 'Os campos "nome" e "descricao" são obrigatórios.' });
        return;
      }

      if (nome.trim().length < 2) {
        res.status(400).json({ erro: 'O nome deve ter no mínimo 2 caracteres.' });
        return;
      }

      const novaCategoria = {
        id: uuidv4(),
        nome: nome.trim(),
        descricao: descricao.trim(),
        ativo: ativo !== undefined ? ativo : true,
      };

      const { data, error } = await supabase
        .from('categorias')
        .insert(novaCategoria)
        .select()
        .single();

      if (error) throw error;

      res.status(201).json(data);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao criar categoria.', detalhe: error.message });
    }
  },

  // PUT /categorias/:id
  async atualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateCategoriaDTO = req.body;

      if (Object.keys(updates).length === 0) {
        res.status(400).json({ erro: 'Nenhum campo fornecido para atualização.' });
        return;
      }

      if (updates.nome && updates.nome.trim().length < 2) {
        res.status(400).json({ erro: 'O nome deve ter no mínimo 2 caracteres.' });
        return;
      }

      const { data, error } = await supabase
        .from('categorias')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        res.status(404).json({ erro: 'Categoria não encontrada.' });
        return;
      }

      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao atualizar categoria.', detalhe: error.message });
    }
  },

  // DELETE /categorias/:id
  async deletar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verifica se existem produtos vinculados
      const { data: produtos } = await supabase
        .from('produtos')
        .select('id')
        .eq('categoria_id', id)
        .limit(1);

      if (produtos && produtos.length > 0) {
        res.status(409).json({ erro: 'Não é possível excluir uma categoria com produtos vinculados.' });
        return;
      }

      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ erro: 'Erro ao deletar categoria.', detalhe: error.message });
    }
  },
};
