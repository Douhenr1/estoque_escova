import request from 'supertest';
import { validate as validarUuid } from 'uuid';
import { afterAll, describe, expect, it } from 'vitest';
import app from '../../app';
import { supabase } from '../../config/supabase';

describe('Integração — Categorias (/categorias)', () => {
  const idsCriados: string[] = [];

  afterAll(async () => {
    if (idsCriados.length > 0) {
      await supabase.from('categorias').delete().in('id', idsCriados);
    }
  });

  it('TI01 — deve cadastrar uma categoria (POST 201) e persistir no banco', async () => {
    const resposta = await request(app).post('/categorias').send({
      nome: 'Categoria Teste TI01',
      descricao: 'Escovas para teste de integração TI01',
      ativo: true,
    });

    expect(resposta.status).toBe(201);
    expect(validarUuid(resposta.body.id)).toBe(true);
    expect(resposta.body.nome).toBe('Categoria Teste TI01');
    expect(resposta.body.descricao).toBe('Escovas para teste de integração TI01');
    expect(resposta.body.ativo).toBe(true);

    idsCriados.push(resposta.body.id);

    const consultaBanco = await supabase
      .from('categorias')
      .select('*')
      .eq('id', resposta.body.id)
      .single();

    expect(consultaBanco.error).toBeNull();
    expect(consultaBanco.data?.nome).toBe('Categoria Teste TI01');
  });

  it('deve listar todas as categorias (GET 200)', async () => {
    const resposta = await request(app).get('/categorias');

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body)).toBe(true);
    expect(resposta.body.length).toBeGreaterThanOrEqual(1);
  });

  it('deve consultar uma categoria por ID (GET /:id 200) e retornar 400/404 para IDs inválidos ou inexistentes', async () => {
    const id = idsCriados[0];

    const ok = await request(app).get(`/categorias/${id}`);
    expect(ok.status).toBe(200);
    expect(ok.body.id).toBe(id);

    const invalido = await request(app).get('/categorias/uuid-invalido');
    expect(invalido.status).toBe(400);

    const inexistente = await request(app).get(
      '/categorias/00000000-0000-4000-8000-000000000000'
    );
    expect(inexistente.status).toBe(404);
  });

  it('deve atualizar uma categoria existente (PUT /:id 200)', async () => {
    const id = idsCriados[0];

    const resposta = await request(app).put(`/categorias/${id}`).send({
      nome: 'Categoria Teste TI01 Atualizada',
      ativo: false,
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body.nome).toBe('Categoria Teste TI01 Atualizada');
    expect(resposta.body.ativo).toBe(false);
  });

  it('deve rejeitar cadastro de categoria com payload inválido (POST 400)', async () => {
    const resposta = await request(app).post('/categorias').send({
      nome: 'A',
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBeDefined();
  });

  it('deve excluir uma categoria sem produtos vinculados (DELETE /:id 204)', async () => {
    const criada = await request(app).post('/categorias').send({
      nome: 'Categoria Para Excluir',
      descricao: 'Categoria temporária de teste',
    });
    expect(criada.status).toBe(201);
    const id = criada.body.id;
    idsCriados.push(id);

    const exclusao = await request(app).delete(`/categorias/${id}`);
    expect(exclusao.status).toBe(204);

    const buscaAposExclusao = await request(app).get(`/categorias/${id}`);
    expect(buscaAposExclusao.status).toBe(404);
  });
});
