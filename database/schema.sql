-- ============================================================================
-- BrushFlow API — Script SQL para Supabase (PostgreSQL)
-- Execute este script no SQL Editor do painel do Supabase.
-- ============================================================================

-- 1. Tabela: categorias
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabela: produtos (Escovas)
-- RN01: constraint CHECK impede estoque negativo no banco de dados.
-- RN03/Integridade: ON DELETE RESTRICT impede excluir categoria com produtos vinculados.
CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY,
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE RESTRICT,
  nome VARCHAR(150) NOT NULL,
  descricao TEXT NOT NULL,
  tipo_cerdas VARCHAR(10) NOT NULL CHECK (tipo_cerdas IN ('macia', 'media', 'dura')),
  quantidade_estoque INTEGER NOT NULL DEFAULT 0 CHECK (quantidade_estoque >= 0),
  estoque_minimo INTEGER NOT NULL DEFAULT 0 CHECK (estoque_minimo >= 0),
  preco_unitario NUMERIC(10, 2) NOT NULL CHECK (preco_unitario > 0),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela: pedidos_reposicao
-- RN03: ON DELETE RESTRICT impede excluir produto com pedidos de reposição vinculados.
CREATE TABLE IF NOT EXISTS pedidos_reposicao (
  id UUID PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  quantidade_solicitada INTEGER NOT NULL CHECK (quantidade_solicitada > 0),
  quantidade_recebida INTEGER CHECK (quantidade_recebida IS NULL OR quantidade_recebida > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'aprovado', 'recebido', 'cancelado')),
  fornecedor VARCHAR(150) NOT NULL,
  observacoes TEXT,
  data_solicitacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_recebimento TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para melhorar consultas por filtro e FK
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_id ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_produto_id ON pedidos_reposicao(produto_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos_reposicao(status);

-- ============================================================================
-- Atualização de constraints para bancos já criados anteriormente (idempotente)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_produtos_quantidade_estoque_nao_negativa'
  ) THEN
    ALTER TABLE produtos
      ADD CONSTRAINT chk_produtos_quantidade_estoque_nao_negativa
      CHECK (quantidade_estoque >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_produtos_estoque_minimo_nao_negativo'
  ) THEN
    ALTER TABLE produtos
      ADD CONSTRAINT chk_produtos_estoque_minimo_nao_negativo
      CHECK (estoque_minimo >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_produtos_preco_unitario_positivo'
  ) THEN
    ALTER TABLE produtos
      ADD CONSTRAINT chk_produtos_preco_unitario_positivo
      CHECK (preco_unitario > 0);
  END IF;
END $$;

-- ============================================================================
-- RN02 — Função RPC transacional para recebimento seguro de pedido de reposição
-- Garante atomicidade e proteção contra requisições concorrentes via FOR UPDATE.
-- ============================================================================
CREATE OR REPLACE FUNCTION receber_pedido_reposicao(
  p_pedido_id UUID,
  p_quantidade_recebida INTEGER DEFAULT NULL
)
RETURNS SETOF pedidos_reposicao
LANGUAGE plpgsql
AS $$
DECLARE
  v_pedido pedidos_reposicao%ROWTYPE;
  v_quantidade INTEGER;
BEGIN
  -- Travamento pessimista da linha do pedido para evitar race condition
  SELECT *
  INTO v_pedido
  FROM pedidos_reposicao
  WHERE id = p_pedido_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PEDIDO_NAO_ENCONTRADO';
  END IF;

  IF v_pedido.status = 'recebido' THEN
    RAISE EXCEPTION 'PEDIDO_JA_RECEBIDO';
  END IF;

  IF v_pedido.status = 'cancelado' THEN
    RAISE EXCEPTION 'PEDIDO_CANCELADO';
  END IF;

  IF v_pedido.status <> 'pendente' THEN
    RAISE EXCEPTION 'PEDIDO_STATUS_INVALIDO';
  END IF;

  v_quantidade := COALESCE(p_quantidade_recebida, v_pedido.quantidade_solicitada);

  IF v_quantidade IS NULL OR v_quantidade <= 0 THEN
    RAISE EXCEPTION 'QUANTIDADE_INVALIDA';
  END IF;

  -- Atualiza estoque do produto na mesma transação
  UPDATE produtos
  SET quantidade_estoque = quantidade_estoque + v_quantidade,
      updated_at = NOW()
  WHERE id = v_pedido.produto_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PRODUTO_NAO_ENCONTRADO';
  END IF;

  -- Atualiza status e dados de recebimento do pedido na mesma transação
  RETURN QUERY
  UPDATE pedidos_reposicao
  SET status = 'recebido',
      quantidade_recebida = v_quantidade,
      data_recebimento = NOW(),
      updated_at = NOW()
  WHERE id = p_pedido_id
  RETURNING *;
END;
$$;

-- Mantida para compatibilidade com scripts anteriores (com validação de inteiro positivo)
CREATE OR REPLACE FUNCTION incrementar_estoque(p_produto_id UUID, p_quantidade INTEGER)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_quantidade IS NULL OR p_quantidade <= 0 THEN
    RAISE EXCEPTION 'QUANTIDADE_INVALIDA';
  END IF;

  UPDATE produtos
  SET quantidade_estoque = quantidade_estoque + p_quantidade,
      updated_at = NOW()
  WHERE id = p_produto_id;
END;
$$;
