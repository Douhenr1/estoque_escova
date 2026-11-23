import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../../app';
import { supabase } from '../../config/supabase';

describe('Integração — Pedidos de Reposição (/pedidos-reposicao)', () => {
  let categoriaId = '';
  let produtoId = '';
  const pedidosCriados: string[] = [];

  beforeAll(async () => {
    const categoria = await request(app).post('/categorias').send({
      nome: 'Categoria Base Pedidos TI03',
      descricao: 'Categoria auxiliar para testes de pedidos de reposição',
    });
    categoriaId = categoria.body.id;

    const produto = await request(app).post('/produtos').send({
      categoria_id: categoriaId,
      nome: 'Escova Base TI03',
      descricao: 'Escova para testar recebimento de pedido de reposição',
      tipo_cerdas: 'media',
      quantidade_estoque: 10,
      estoque_minimo: 5,
      preco_unitario: 10.0,
    });
    produtoId = produto.body.id;
  });

  afterAll(async () => {
    if (pedidosCriados.length > 0) {
      await supabase.from('pedidos_reposicao').delete().in('id', pedidosCriados);
    }
    if (produtoId) {
      await supabase.from('produtos').delete().eq('id', produtoId);
    }
    if (categoriaId) {
      await supabase.from('categorias').delete().eq('id', categoriaId);
    }
  });

  it('TI03 — deve criar pedido, executar recebimento atômico, incrementar estoque e bloquear recebimento duplicado (RN02)', async () => {
    // 1. Cria pedido de reposição de 20 unidades
    const criacao = await request(app).post('/pedidos-reposicao').send({
      produto_id: produtoId,
      quantidade_solicitada: 20,
      fornecedor: 'DenteCerto Distribuidora Ltda.',
      observacoes: 'Pedido de teste TI03',
    });

    expect(criacao.status).toBe(201);
    expect(criacao.body.status).toBe('pendente');
    const pedidoId = criacao.body.id;
    pedidosCriados.push(pedidoId);

    // 2. Recebe o pedido via rota dedicada PATCH /:id/receber
    const recebimento = await request(app)
      .patch(`/pedidos-reposicao/${pedidoId}/receber`)
      .send({ quantidade_recebida: 20 });

    expect(recebimento.status).toBe(200);
    expect(recebimento.body.status).toBe('recebido');
    expect(recebimento.body.quantidade_recebida).toBe(20);
    expect(recebimento.body.data_recebimento).toBeTruthy();

    // 3. Confirma incremento do estoque no produto (10 + 20 = 30)
    const produtoAposRecebimento = await request(app).get(`/produtos/${produtoId}`);
    expect(produtoAposRecebimento.status).toBe(200);
    expect(produtoAposRecebimento.body.quantidade_estoque).toBe(30);

    // 4. Segunda tentativa de recebimento deve retornar HTTP 409 e manter estoque em 30
    const segundaTentativa = await request(app)
      .patch(`/pedidos-reposicao/${pedidoId}/receber`)
      .send({ quantidade_recebida: 20 });

    expect(segundaTentativa.status).toBe(409);

    const produtoAposDuplicata = await request(app).get(`/produtos/${produtoId}`);
    expect(produtoAposDuplicata.body.quantidade_estoque).toBe(30);
  });

  it('RN03 — deve impedir exclusão de produto vinculado a pedido de reposição (HTTP 409)', async () => {
    const exclusaoProduto = await request(app).delete(`/produtos/${produtoId}`);
    expect(exclusaoProduto.status).toBe(409);
  });

  it('deve listar pedidos, consultar por ID, atualizar e excluir pedido pendente', async () => {
    const novoPedido = await request(app).post('/pedidos-reposicao').send({
      produto_id: produtoId,
      quantidade_solicitada: 15,
      fornecedor: 'Fornecedor Temporário',
    });

    expect(novoPedido.status).toBe(201);
    const pedidoId = novoPedido.body.id;
    pedidosCriados.push(pedidoId);

    const listagem = await request(app).get(`/pedidos-reposicao?produto_id=${produtoId}`);
    expect(listagem.status).toBe(200);
    expect(Array.isArray(listagem.body)).toBe(true);
    expect(listagem.body.some((p: any) => p.id === pedidoId)).toBe(true);

    const consulta = await request(app).get(`/pedidos-reposicao/${pedidoId}`);
    expect(consulta.status).toBe(200);
    expect(consulta.body.id).toBe(pedidoId);

    const atualizacao = await request(app).put(`/pedidos-reposicao/${pedidoId}`).send({
      quantidade_solicitada: 30,
      observacoes: 'Quantidade ajustada',
    });
    expect(atualizacao.status).toBe(200);
    expect(atualizacao.body.quantidade_solicitada).toBe(30);

    const exclusao = await request(app).delete(`/pedidos-reposicao/${pedidoId}`);
    expect(exclusao.status).toBe(204);

    const buscaAposExclusao = await request(app).get(`/pedidos-reposicao/${pedidoId}`);
    expect(buscaAposExclusao.status).toBe(404);
  });

  it('deve impedir exclusão de pedido já recebido (DELETE /:id 409)', async () => {
    const pedidoRecebidoId = pedidosCriados[0];

    const resposta = await request(app).delete(`/pedidos-reposicao/${pedidoRecebidoId}`);
    expect(resposta.status).toBe(409);
  });
});
