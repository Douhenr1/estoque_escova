# BrushFlow API (`estoque_escova`)

API REST desenvolvida em **Node.js**, **TypeScript**, **Express** e **Supabase (PostgreSQL)** para gerenciamento de estoque e logística de uma empresa de escovas de dentes. O sistema controla o catálogo de produtos organizado por categorias, protege o saldo de estoque com regras de negócio e gerencia pedidos de reposição junto a fornecedores.

## Objetivo do sistema

Evoluir a API REST iniciada no primeiro bimestre para uma arquitetura Back-End em camadas orientada a objetos, resolvendo falhas de integridade de estoque (saldo negativo, recebimento duplicado de pedidos e exclusão de produtos com histórico), com testes automatizados (unitários e de integração), cobertura acima de 60%, documentação interativa Swagger/OpenAPI e suporte a deploy na Vercel.

## Integrante da equipe

* **Douglas Henrique De Almeida Liz**

* Giovanna Assis

## Tecnologias utilizadas

* **Node.js** e **TypeScript**

* **Express**

* **Supabase / PostgreSQL** (`@supabase/supabase-js` + `ws`)

* **UUID**

* **Vitest** e **@vitest/coverage-v8**

* **Supertest**

* **Swagger / OpenAPI 3.0** (`swagger-ui-express`)

* **dotenv**

* **Git / GitHub**

* **Vercel** (deploy serverless)

## Entidades e relacionamentos

### Categoria (`categorias`)

| Campo | Tipo | Descrição | 
| ----- | ----- | ----- | 
| `id` | UUID (PK) | Identificador único | 
| `nome` | VARCHAR(100) | Nome da categoria | 
| `descricao` | TEXT | Descrição da categoria | 
| `ativo` | BOOLEAN | Indica se a categoria está ativa | 
| `created_at` | TIMESTAMPTZ | Data de criação | 
| `updated_at` | TIMESTAMPTZ | Data da última atualização | 

### Produto / Escova (`produtos`)

| Campo | Tipo | Descrição | 
| ----- | ----- | ----- | 
| `id` | UUID (PK) | Identificador único | 
| `categoria_id` | UUID (FK → `categorias.id`) | Categoria à qual o produto pertence (`ON DELETE RESTRICT`) | 
| `nome` | VARCHAR(150) | Nome do produto | 
| `descricao` | TEXT | Descrição do produto | 
| `tipo_cerdas` | enum (`macia`, `media`, `dura`) | Tipo de cerdas da escova | 
| `quantidade_estoque` | INTEGER | Quantidade atual em estoque (`CHECK >= 0`) | 
| `estoque_minimo` | INTEGER | Quantidade mínima antes de repor (`CHECK >= 0`) | 
| `preco_unitario` | NUMERIC(10, 2) | Preço unitário do produto (`CHECK > 0`) | 
| `ativo` | BOOLEAN | Indica se o produto está disponível | 
| `created_at` | TIMESTAMPTZ | Data de criação | 
| `updated_at` | TIMESTAMPTZ | Data da última atualização | 

### PedidoReposicao (`pedidos_reposicao`)

| Campo | Tipo | Descrição | 
| ----- | ----- | ----- | 
| `id` | UUID (PK) | Identificador único | 
| `produto_id` | UUID (FK → `produtos.id`) | Produto a ser reposto (`ON DELETE RESTRICT`) | 
| `quantidade_solicitada` | INTEGER | Quantidade pedida ao fornecedor (`CHECK > 0`) | 
| `quantidade_recebida` | INTEGER | Quantidade efetivamente recebida (`CHECK > 0`) | 
| `status` | enum (`pendente`, `aprovado`, `recebido`, `cancelado`) | Status do pedido | 
| `fornecedor` | VARCHAR(150) | Nome do fornecedor | 
| `observacoes` | TEXT | Observações opcionais do pedido | 
| `data_solicitacao` | TIMESTAMPTZ | Data em que o pedido foi gerado | 
| `data_recebimento` | TIMESTAMPTZ | Data em que o pedido foi recebido | 
| `created_at` | TIMESTAMPTZ | Data de criação | 
| `updated_at` | TIMESTAMPTZ | Data da última atualização | 

### Relacionamentos

* Uma **Categoria** pode conter vários **Produtos**; cada **Produto** pertence a uma **Categoria**.

* Um **Produto** pode ter vários **Pedidos de Reposição**; cada **Pedido de Reposição** está vinculado a um único **Produto**.

## Arquitetura em camadas e POO

O projeto aplica Programação Orientada a Objetos (classes de entidade, interfaces de repositório, encapsulamento e injeção de dependência) com separação clara entre camadas:

* **Routes (`src/routes/`):** Definem os endpoints REST e conectam Repositories, Services e Controllers.

* **Controllers (`src/controllers/`):** Recebem requisições HTTP, extraem parâmetros/JSON, acionam os Services e devolvem status HTTP padronizados.

* **Services (`src/services/`):** Implementam as validações e regras de negócio (**RN01**, **RN02** e **RN03**), isoladas do acesso direto ao banco.

* **Repositories (`src/repositories/`):** Concentram toda a persistência e chamadas RPC no Supabase/PostgreSQL.

* **Models (`src/models/`):** Definem interfaces, DTOs e classes de domínio (`CategoriaEntidade`, `ProdutoEntidade`, `PedidoReposicaoEntidade`).

* **Errors e Middlewares (`src/errors/`, `src/middlewares/`):** Tratamento global com `AppError` e `errorHandler`, sem expor detalhes internos do banco.

## Regras de negócio

### RN01 — Impedir estoque negativo (`ProdutoService`)

* Rejeita cadastro e atualização de produtos com `quantidade_estoque` negativa ou não inteira (**HTTP 422**).

* Rejeita movimentações (`PATCH /produtos/:id/estoque`) que resultem em saldo inferior a zero (por exemplo, tentar retirar 15 unidades de um estoque de 10 mantém o saldo em 10 e retorna **HTTP 422**).

* Garantida também no banco pela constraint `CHECK (quantidade_estoque >= 0)`.

### RN02 — Impedir recebimento duplicado de pedidos (`PedidoReposicaoService`)

* Somente pedidos com status `pendente` podem ser recebidos.

* Pedidos já `recebido`, `cancelado` ou com outro status retornam **HTTP 409** sem incrementar o estoque.

* O recebimento (`PATCH /pedidos-reposicao/:id/receber` ou `PUT /pedidos-reposicao/:id` com `{ "status": "recebido" }`) executa a função RPC transacional `receber_pedido_reposicao` no PostgreSQL com `SELECT ... FOR UPDATE`, atualizando pedido e estoque na mesma transação e protegendo contra requisições concorrentes.

### RN03 — Impedir exclusão de produtos vinculados a pedidos (`ProdutoService`)

* Antes de excluir um produto, verifica se existem pedidos de reposição vinculados.

* Havendo vínculo, bloqueia a exclusão com **HTTP 409**, preservando o histórico e respeitando a chave estrangeira `ON DELETE RESTRICT`.

### Regras complementares

* Não é possível excluir uma **categoria** que possua produtos vinculados (**HTTP 409**).

* Não é possível excluir ou alterar um **pedido** já com status `recebido` (**HTTP 409**).

* Produtos com `quantidade_estoque <= estoque_minimo` são retornados no filtro `GET /produtos?estoque_baixo=true`.

## Estrutura do projeto

```
estoque_escova/
├── api/
│   └── index.ts                         # Entrada serverless para deploy na Vercel
├── database/
│   └── schema.sql                       # Tabelas, constraints e RPC transacional do Supabase
├── src/
│   ├── config/
│   │   ├── supabase.ts                  # Cliente Supabase (suporta ambiente principal e de testes)
│   │   └── swagger.ts                   # Especificação OpenAPI 3.0.3 em português
│   ├── controllers/
│   │   ├── categoria.controller.ts
│   │   ├── produto.controller.ts
│   │   └── pedidoReposicao.controller.ts
│   ├── errors/
│   │   └── AppError.ts                  # Classe padronizada de erros da aplicação
│   ├── middlewares/
│   │   └── errorHandler.ts              # Middleware global de tratamento de erros
│   ├── models/
│   │   ├── categoria.model.ts
│   │   ├── produto.model.ts
│   │   └── pedidoReposicao.model.ts
│   ├── repositories/
│   │   ├── categoria.repository.ts
│   │   ├── produto.repository.ts
│   │   └── pedidoReposicao.repository.ts
│   ├── routes/
│   │   ├── categoria.routes.ts
│   │   ├── produto.routes.ts
│   │   └── pedidoReposicao.routes.ts
│   ├── services/
│   │   ├── categoria.service.ts
│   │   ├── produto.service.ts
│   │   └── pedidoReposicao.service.ts
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── categoria.service.test.ts
│   │   │   ├── pedidoReposicao.service.test.ts
│   │   │   ├── produto.service.test.ts
│   │   │   └── validadores.test.ts
│   │   └── integration/
│   │       ├── categoria.integration.test.ts
│   │       ├── pedidoReposicao.integration.test.ts
│   │       └── produto.integration.test.ts
│   ├── utils/
│   │   └── validadores.ts               # Validadores de UUID, tipos, inteiros e textos
│   ├── app.ts                           # Configuração do Express, rotas, Swagger e errorHandler
│   └── server.ts                        # Inicialização do servidor local
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vercel.json
├── vitest.config.ts
└── README.md

```

## Configuração e execução

### 1. Clonar o repositório

```
git clone https://github.com/Douhenr1/estoque_escova.git
cd estoque_escova

```

### 2. Instalar as dependências

```
npm install

```

### 3. Configurar as variáveis de ambiente

Copie o arquivo de exemplo e preencha com as credenciais do seu projeto Supabase:

```
cp .env.example .env

```

### 4. Preparar o banco de dados no Supabase

No painel do **Supabase**, abra o **SQL Editor**, cole o conteúdo do arquivo [database/schema.sql](https://www.google.com/search?q=database/schema.sql) e clique em **Run**.

### 5. Iniciar a aplicação

```
# Desenvolvimento
npm run dev

# Verificação de tipos e build de produção
npm run typecheck
npm run build
npm start

```

A API estará disponível em `http://localhost:3000`.

## Variáveis de ambiente

| Variável | Obrigatória | Descrição | 
| ----- | ----- | ----- | 
| `PORT` | Não | Porta da API (padrão: `3000`) | 
| `NODE_ENV` | Não | Ambiente (`development`, `test` ou `production`) | 
| `SUPABASE_URL` | Sim | URL base do projeto Supabase (ex.: `https://seu-projeto.supabase.co`, sem `/rest/v1/`) | 
| `SUPABASE_KEY` | Sim | Chave `anon` / `publishable` (ou `secret` se RLS estiver ativo) | 
| `SUPABASE_TEST_URL` | Opcional | URL de projeto Supabase isolado para testes de integração | 
| `SUPABASE_TEST_KEY` | Opcional | Chave do projeto Supabase isolado para testes de integração | 

> Nunca envie o arquivo `.env` com credenciais reais ao repositório. O `.gitignore` bloqueia `.env`, `.env.local` e `.env.test`.

## Banco de dados

O script completo e idempotente para criar ou atualizar as tabelas, constraints (`CHECK` e `ON DELETE RESTRICT`), índices e a função transacional `receber_pedido_reposicao` está em [database/schema.sql](https://www.google.com/search?q=database/schema.sql).

Resumo das principais estruturas criadas no Supabase:

* **Tabelas:** `categorias`, `produtos` (FK `categoria_id` → `categorias.id` com `ON DELETE RESTRICT` e `CHECK (quantidade_estoque >= 0)`) e `pedidos_reposicao` (FK `produto_id` → `produtos.id` com `ON DELETE RESTRICT`).

* **Função RPC `receber_pedido_reposicao(p_pedido_id UUID, p_quantidade_recebida INTEGER)`:** bloqueia a linha do pedido com `FOR UPDATE`, valida status `pendente`, incrementa o estoque em `produtos` e marca o pedido como `recebido` na mesma transação.

## Endpoints da API

### Sistema

| Método | Endpoint | Descrição | 
| ----- | ----- | ----- | 
| `GET` | `/` | Status e informações da API | 
| `GET` | `/api-docs` | Documentação interativa Swagger UI | 
| `GET` | `/api-docs.json` | Especificação OpenAPI em JSON | 

### Categorias

| Método | Endpoint | Descrição | 
| ----- | ----- | ----- | 
| `GET` | `/categorias` | Lista todas as categorias | 
| `GET` | `/categorias/:id` | Busca uma categoria pelo ID | 
| `POST` | `/categorias` | Cadastra uma nova categoria | 
| `PUT` | `/categorias/:id` | Atualiza uma categoria | 
| `DELETE` | `/categorias/:id` | Remove uma categoria (sem produtos vinculados) | 

### Produtos

| Método | Endpoint | Descrição | 
| ----- | ----- | ----- | 
| `GET` | `/produtos` | Lista todos os produtos (filtros: `categoria_id`, `estoque_baixo=true`) | 
| `GET` | `/produtos/:id` | Busca um produto pelo ID | 
| `POST` | `/produtos` | Cadastra um novo produto (valida RN01) | 
| `PUT` | `/produtos/:id` | Atualiza um produto (valida RN01) | 
| `PATCH` | `/produtos/:id/estoque` | Movimenta estoque por variação inteira (valida RN01) | 
| `DELETE` | `/produtos/:id` | Remove um produto sem pedidos vinculados (valida RN03) | 

### Pedidos de Reposição

| Método | Endpoint | Descrição | 
| ----- | ----- | ----- | 
| `GET` | `/pedidos-reposicao` | Lista todos os pedidos (filtros: `status`, `produto_id`) | 
| `GET` | `/pedidos-reposicao/:id` | Busca um pedido pelo ID | 
| `POST` | `/pedidos-reposicao` | Abre um novo pedido de reposição (`pendente`) | 
| `PUT` | `/pedidos-reposicao/:id` | Atualiza um pedido (status `recebido` aciona RN02) | 
| `PATCH` | `/pedidos-reposicao/:id/receber` | Recebe pedido pendente de forma atômica (RN02) | 
| `DELETE` | `/pedidos-reposicao/:id` | Remove um pedido ainda não recebido | 

## Exemplos de requisições JSON

### Criar uma categoria (`POST /categorias`)

```
{
  "nome": "Infantil",
  "descricao": "Escovas de dente para crianças de 2 a 12 anos",
  "ativo": true
}

```

### Criar um produto (`POST /produtos`)

```
{
  "categoria_id": "11111111-1111-4111-8111-111111111111",
  "nome": "EscovaMax Kids",
  "descricao": "Escova de dente infantil com cabo antiderrapante e cabeça pequena",
  "tipo_cerdas": "macia",
  "quantidade_estoque": 500,
  "estoque_minimo": 100,
  "preco_unitario": 8.9,
  "ativo": true
}

```

### Movimentar estoque (`PATCH /produtos/:id/estoque`)

```
{
  "variacao": -5
}

```

### Abrir pedido de reposição (`POST /pedidos-reposicao`)

```
{
  "produto_id": "22222222-2222-4222-8222-222222222222",
  "quantidade_solicitada": 200,
  "fornecedor": "DenteCerto Distribuidora Ltda.",
  "observacoes": "Entrega urgente, estoque crítico"
}

```

### Registrar recebimento do pedido (`PATCH /pedidos-reposicao/:id/receber`)

```
{
  "quantidade_recebida": 200
}

```

## Testes automatizados e cobertura

O projeto utiliza **Vitest**, **@vitest/coverage-v8** e **Supertest**.

* **Testes unitários (`src/tests/unit/`):** 33 cenários isolados com mocks dos Repositories, cobrindo **TU01** (RN01 — estoque negativo), **TU02** (RN02 — recebimento duplicado), **TU03** (RN03 — exclusão de produto vinculado), `CategoriaService`, `validadores` e `errorHandler`.

* **Testes de integração (`src/tests/integration/`):** 15 cenários com Supertest contra o Supabase, cobrindo **TI01** (cadastro de categoria), **TI02** (cadastro e consulta de escova), **TI03** (recebimento atômico e bloqueio de duplicidade) e todo o CRUD das 3 entidades, com limpeza automática dos registros criados em `afterAll`.

### Comandos de execução

```
# Todos os testes (unitários + integração)
npm test

# Apenas testes unitários (sem conexão com banco)
npm run test:unit

# Apenas testes de integração
npm run test:integration

# Relatório completo de cobertura (mínimo exigido: 60% nas 4 métricas)
npm run test:coverage

```

### Resultados reais de cobertura (`npm run test:coverage`)

| Métrica | Mínimo exigido | Resultado obtido | 
| ----- | ----- | ----- | 
| **Lines** | 60% | **82.5%** | 
| **Statements** | 60% | **82.5%** | 
| **Functions** | 60% | **97.61%** | 
| **Branches** | 60% | **66.78%** | 

## Documentação Swagger/OpenAPI

Com a API rodando localmente (`npm run dev`), acesse:

* **Interface interativa:** `http://localhost:3000/api-docs`

* **Especificação JSON:** `http://localhost:3000/api-docs.json`

A documentação apresenta todos os endpoints das três entidades, parâmetros, exemplos JSON e códigos HTTP de sucesso e erro.

## Deploy na Vercel (opcional)

O projeto está preparado para deploy serverless na **Vercel** com `api/index.ts` e `vercel.json`:

1. Importe o repositório `https://github.com/Douhenr1/estoque_escova` na Vercel.

2. Em **Environment Variables**, configure `SUPABASE_URL` e `SUPABASE_KEY`.

3. Clique em **Deploy** e valide `/` e `/api-docs` na URL gerada.