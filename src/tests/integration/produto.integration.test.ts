import request from 'supertest';
import { validate as validarUuid } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../../app';
import { supabase } from '../../config/supabase';

describe('Integração — Produtos (/produtos)', () => {
  let categoriaId = '';
  const produtosCriados: string[] = [];

  beforeAll(async () => {
    const respostaCategoria = await request(app).post('/categorias').send({
      nome: 'Categoria Base Produtos TI02',
      descricao: 'Categoria auxiliar para testes de integração de produtos',
    });
    categoriaId = respostaCategoria.body.id;
  });

  afterAll(async () => {
    if (produtosCriados.length > 0) {
      await supabase.from('pedidos_reposicao').delete().in('produto_id', produtosCriados);
      await supabase.from('produtos').delete().in('id', produtosCriados);
    }
    if (categoriaId) {
      await supabase.from('categorias').delete().eq('id', categoriaId);
    }
  });

  it('TI02 — deve cadastrar uma escova (POST 201) e consultá-la por ID (GET 200) com UUID válido', async () => {
    const cadastro = await request(app).post('/produtos').send({
      categoria_id: categoriaId,
      nome: 'EscovaMax TI02',
      descricao: 'Escova com cerdas macias para teste de integração',
      tipo_cerdas: 'macia',
      quantidade_estoque: 25,
      estoque_minimo: 10,
      preco_unitario: 11.5,
      ativo: true,
    });

    expect(cadastro.status).toBe(201);
    expect(validarUuid(cadastro.body.id)).toBe(true);
    expect(cadastro.body.nome).toBe('EscovaMax TI02');
    expect(cadastro.body.quantidade_estoque).toBe(25);

    produtosCriados.push(cadastro.body.id);

    const consulta = await request(app).get(`/produtos/${cadastro.body.id}`);
    expect(consulta.status).toBe(200);
    expect(consulta.body.id).toBe(cadastro.body.id);
    expect(consulta.body.nome).toBe('EscovaMax TI02');
    expect(consulta.body.tipo_cerdas).toBe('macia');
  });

  it('deve listar produtos com filtros de categoria_id e estoque_baixo=true (GET 200)', async () => {
    const produtoEstoqueBaixo = await request(app).post('/produtos').send({
      categoria_id: categoriaId,
      nome: 'Escova Estoque Crítico',
      descricao: 'Produto com estoque abaixo do mínimo',
      tipo_cerdas: 'media',
      quantidade_estoque: 3,
      estoque_minimo: 10,
      preco_unitario: 15.0,
    });

    expect(produtoEstoqueBaixo.status).toBe(201);
    produtosCriados.push(produtoEstoqueBaixo.body.id);

    const resposta = await request(app).get(
      `/produtos?categoria_id=${categoriaId}&estoque_baixo=true`
    );

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body)).toBe(true);
    expect(resposta.body.some((p: any) => p.id === produtoEstoqueBaixo.body.id)).toBe(true);
  });

  it('RN01 — deve impedir cadastro e atualização com estoque negativo (HTTP 422)', async () => {
    const cadastroInvalido = await request(app).post('/produtos').send({
      categoria_id: categoriaId,
      nome: 'Escova Estoque Negativo',
      descricao: 'Não deve ser cadastrada',
      tipo_cerdas: 'dura',
      quantidade_estoque: -10,
      estoque_minimo: 5,
      preco_unitario: 9.9,
    });

    expect(cadastroInvalido.status).toBe(422);

    const produtoId = produtosCriados[0];
    const atualizacaoInvalida = await request(app).put(`/produtos/${produtoId}`).send({
      quantidade_estoque: -1,
    });

    expect(atualizacaoInvalida.status).toBe(422);

    const retiradaExcedente = await request(app)
      .patch(`/produtos/${produtoId}/estoque`)
      .send({ variacao: -100 });

    expect(retiradaExcedente.status).toBe(422);
  });

  it('deve atualizar um produto com dados válidos (PUT /:id 200)', async () => {
    const produtoId = produtosCriados[0];

    const resposta = await request(app).put(`/produtos/${produtoId}`).send({
      nome: 'EscovaMax TI02 Premium',
      quantidade_estoque: 40,
      preco_unitario: 13.9,
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.nome).toBe('EscovaMax TI02 Premium');
    expect(resposta.body.quantidade_estoque).toBe(40);
  });

  it('deve excluir produto sem pedidos vinculados (DELETE /:id 204)', async () => {
    const criado = await request(app).post('/produtos').send({
      categoria_id: categoriaId,
      nome: 'Escova Temporária Exclusão',
      descricao: 'Produto para testar exclusão',
      tipo_cerdas: 'macia',
      quantidade_estoque: 5,
      estoque_minimo: 2,
      preco_unitario: 7.5,
    });

    expect(criado.status).toBe(201);
    const id = criado.body.id;
    produtosCriados.push(id);

    const exclusao = await request(app).delete(`/produtos/${id}`);
    expect(exclusao.status).toBe(204);

    const consulta = await request(app).get(`/produtos/${id}`);
    expect(consulta.status).toBe(404);
  });
});
