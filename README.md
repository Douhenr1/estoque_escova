#  estoque_escova

API REST para gerenciamento de estoque e logística de uma empresa de escovas de dentes. O sistema permite controlar o catálogo de produtos, organizado por categorias, e gerenciar pedidos de reposição de estoque junto a fornecedores.

---

## 👥 Integrantes da equipe

- Douglas Henrique De Almeida Liz
- Giovanna Souza de Assis


---

##  Tecnologias utilizadas

- Node.js
- TypeScript
- Express
- Supabase
- Git
- UUID

---

##  Entidades e relacionamento

### Categoria

| Campo       | Tipo      | Descrição                        |
|-------------|-----------|----------------------------------|
| id          | UUID      | Identificador único              |
| nome        | string    | Nome da categoria                |
| descricao   | string    | Descrição da categoria           |
| ativo       | boolean   | Indica se a categoria está ativa |
| created_at  | timestamp | Data de criação                  |
| updated_at  | timestamp | Data da última atualização       |

### Produto

| Campo               | Tipo                        | Descrição                                    |
|---------------------|-----------------------------|----------------------------------------------|
| id                  | UUID                        | Identificador único                          |
| categoria_id        | UUID (FK → categorias)      | Categoria à qual o produto pertence          |
| nome                | string                      | Nome do produto                              |
| descricao           | string                      | Descrição do produto                         |
| tipo_cerdas         | enum (macia, media, dura)   | Tipo de cerdas da escova                     |
| quantidade_estoque  | integer                     | Quantidade atual em estoque                  |
| estoque_minimo      | integer                     | Quantidade mínima antes de repor             |
| preco_unitario      | numeric                     | Preço unitário do produto                    |
| ativo               | boolean                     | Indica se o produto está disponível          |
| created_at          | timestamp                   | Data de criação                              |
| updated_at          | timestamp                   | Data da última atualização                   |

### PedidoReposicao

| Campo                 | Tipo                                        | Descrição                               |
|-----------------------|---------------------------------------------|-----------------------------------------|
| id                    | UUID                                        | Identificador único                     |
| produto_id            | UUID (FK → produtos)                        | Produto a ser reposto                   |
| quantidade_solicitada | integer                                     | Quantidade pedida ao fornecedor         |
| quantidade_recebida   | integer                                     | Quantidade efetivamente recebida        |
| status                | enum (pendente, aprovado, recebido, cancelado) | Status do pedido                     |
| fornecedor            | string                                      | Nome do fornecedor                      |
| observacoes           | string                                      | Observações opcionais do pedido         |
| data_solicitacao      | timestamp                                   | Data em que o pedido foi gerado         |
| data_recebimento      | timestamp                                   | Data em que o pedido foi recebido       |
| created_at            | timestamp                                   | Data de criação                         |
| updated_at            | timestamp                                   | Data da última atualização              |

### Relacionamentos

- Uma **Categoria** pode conter vários **Produtos**; cada **Produto** pertence a uma **Categoria**.
- Um **Produto** pode ter vários **Pedidos de Reposição**; cada **Pedido de Reposição** está vinculado a um único **Produto**.

---

##  Estrutura do projeto

```
escovas/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Configuração do cliente Supabase
│   ├── controllers/
│   │   ├── categoria.controller.ts
│   │   ├── produto.controller.ts
│   │   └── pedidoReposicao.controller.ts
│   ├── models/
│   │   ├── categoria.model.ts
│   │   ├── produto.model.ts
│   │   └── pedidoReposicao.model.ts
│   ├── routes/
│   │   ├── categoria.routes.ts
│   │   ├── produto.routes.ts
│   │   └── pedidoReposicao.routes.ts
│   ├── app.ts                   # Configuração do Express e rotas
│   └── server.ts                # Inicialização do servidor
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## ⚙️ Configuração e execução

### 1. Clonar o repositório

```bash
git clone https://github.com/Douhenr1/estoque_escova.git
cd projeto_estoque
```

### 2. Instalar as dependências

```bash
npm install
```

### 3. Configurar as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais do Supabase:

```bash
cp .env.example .env
```

Edite o `.env` com seus dados reais.

### 4. Iniciar a aplicação

```bash
npm run dev
```

A API estará disponível em: `http://localhost:3000`

---

##  Variáveis de ambiente

| Variável       | Descrição                                      |
|----------------|------------------------------------------------|
| PORT           | Porta em que a API vai rodar (padrão: 3000)    |
| SUPABASE_URL   | URL do projeto Supabase                        |
| SUPABASE_KEY   | Chave anon pública do Supabase                 |



---

##  Banco de dados

### Criação das tabelas no Supabase

Execute os scripts abaixo no **SQL Editor** do Supabase:

```sql
-- Tabela: categorias
CREATE TABLE categorias (
  id UUID PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: produtos
CREATE TABLE produtos (
  id UUID PRIMARY KEY,
  categoria_id UUID NOT NULL REFERENCES categorias(id),
  nome VARCHAR(150) NOT NULL,
  descricao TEXT NOT NULL,
  tipo_cerdas VARCHAR(10) NOT NULL CHECK (tipo_cerdas IN ('macia', 'media', 'dura')),
  quantidade_estoque INTEGER NOT NULL DEFAULT 0,
  estoque_minimo INTEGER NOT NULL DEFAULT 0,
  preco_unitario NUMERIC(10, 2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: pedidos_reposicao
CREATE TABLE pedidos_reposicao (
  id UUID PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES produtos(id),
  quantidade_solicitada INTEGER NOT NULL,
  quantidade_recebida INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'aprovado', 'recebido', 'cancelado')),
  fornecedor VARCHAR(150) NOT NULL,
  observacoes TEXT,
  data_solicitacao TIMESTAMPTZ DEFAULT NOW(),
  data_recebimento TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Função para incrementar estoque ao receber pedido
CREATE OR REPLACE FUNCTION incrementar_estoque(p_produto_id UUID, p_quantidade INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE produtos
  SET quantidade_estoque = quantidade_estoque + p_quantidade,
      updated_at = NOW()
  WHERE id = p_produto_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 📋 Documentação dos endpoints

### Categorias

| Método | Endpoint          | Descrição                         |
|--------|-------------------|-----------------------------------|
| GET    | /categorias       | Lista todas as categorias         |
| GET    | /categorias/:id   | Busca uma categoria pelo ID       |
| POST   | /categorias       | Cadastra uma nova categoria       |
| PUT    | /categorias/:id   | Atualiza uma categoria            |
| DELETE | /categorias/:id   | Remove uma categoria              |

### Produtos

| Método | Endpoint        | Descrição                                                        |
|--------|-----------------|------------------------------------------------------------------|
| GET    | /produtos       | Lista todos os produtos (filtros: `categoria_id`, `estoque_baixo=true`) |
| GET    | /produtos/:id   | Busca um produto pelo ID                                         |
| POST   | /produtos       | Cadastra um novo produto                                         |
| PUT    | /produtos/:id   | Atualiza um produto                                              |
| DELETE | /produtos/:id   | Remove um produto                                                |

**Query params disponíveis em `GET /produtos`:**
- `categoria_id` — filtra por categoria
- `estoque_baixo=true` — retorna apenas produtos com estoque ≤ estoque mínimo

### Pedidos de Reposição

| Método | Endpoint                  | Descrição                                               |
|--------|---------------------------|---------------------------------------------------------|
| GET    | /pedidos-reposicao        | Lista todos os pedidos (filtros: `status`, `produto_id`) |
| GET    | /pedidos-reposicao/:id    | Busca um pedido pelo ID                                 |
| POST   | /pedidos-reposicao        | Abre um novo pedido de reposição                        |
| PUT    | /pedidos-reposicao/:id    | Atualiza um pedido (status, recebimento etc.)           |
| DELETE | /pedidos-reposicao/:id    | Remove um pedido (somente se não recebido)              |

---

## 📌 Exemplos de requisições

### Criar uma categoria

`POST /categorias`

```json
{
  "nome": "Infantil",
  "descricao": "Escovas de dente para crianças de 2 a 12 anos",
  "ativo": true
}
```

### Criar um produto

`POST /produtos`

```json
{
  "categoria_id": "uuid-da-categoria",
  "nome": "EscovaMax Kids",
  "descricao": "Escova de dente infantil com cabo antiderrapante e cabeça pequena",
  "tipo_cerdas": "macia",
  "quantidade_estoque": 500,
  "estoque_minimo": 100,
  "preco_unitario": 8.90,
  "ativo": true
}
```

### Abrir pedido de reposição

`POST /pedidos-reposicao`

```json
{
  "produto_id": "uuid-do-produto",
  "quantidade_solicitada": 200,
  "fornecedor": "DenteCerto Distribuidora Ltda.",
  "observacoes": "Entrega urgente, estoque crítico"
}
```

### Registrar recebimento do pedido

`PUT /pedidos-reposicao/:id`

```json
{
  "status": "recebido",
  "quantidade_recebida": 200
}
```

---

## ✅ Regras de negócio

- Não é possível excluir uma **categoria** que possua produtos vinculados.
- Não é possível excluir um **produto** que possua pedidos de reposição vinculados.
- Não é possível excluir ou alterar um **pedido** com status `recebido`.
- Ao marcar um pedido como `recebido`, o estoque do produto é atualizado automaticamente.
- Produtos com `quantidade_estoque <= estoque_minimo` são sinalizados como estoque baixo.
