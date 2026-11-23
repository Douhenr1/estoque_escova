export const especificacaoSwagger = {
  openapi: '3.0.3',
  info: {
    title: 'BrushFlow API',
    version: '1.1.0',
    description:
      'API REST para gerenciamento de categorias, produtos (escovas de dentes) e pedidos de reposição de estoque, com arquitetura em camadas, regras de negócio (RN01, RN02 e RN03) e persistência em Supabase/PostgreSQL.',
  },
  servers: [
    {
      url: '/',
      description: 'Servidor local de desenvolvimento',
    },
  ],
  tags: [
    { name: 'Sistema', description: 'Verificação de status da API' },
    { name: 'Categorias', description: 'Gerenciamento de categorias de escovas' },
    { name: 'Produtos', description: 'Gerenciamento de produtos (escovas) e estoque' },
    {
      name: 'Pedidos de Reposição',
      description: 'Gerenciamento e recebimento atômico de pedidos de reposição',
    },
  ],
  components: {
    schemas: {
      ErroPadrao: {
        type: 'object',
        properties: {
          erro: { type: 'string', example: 'Mensagem descritiva do erro.' },
        },
      },
      Categoria: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '11111111-1111-4111-8111-111111111111' },
          nome: { type: 'string', example: 'Infantil' },
          descricao: { type: 'string', example: 'Escovas de dente para crianças de 2 a 12 anos' },
          ativo: { type: 'boolean', example: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      CriarCategoria: {
        type: 'object',
        required: ['nome', 'descricao'],
        properties: {
          nome: { type: 'string', minLength: 2, example: 'Infantil' },
          descricao: { type: 'string', minLength: 2, example: 'Escovas de dente para crianças de 2 a 12 anos' },
          ativo: { type: 'boolean', default: true, example: true },
        },
      },
      AtualizarCategoria: {
        type: 'object',
        properties: {
          nome: { type: 'string', minLength: 2, example: 'Infantil Plus' },
          descricao: { type: 'string', minLength: 2, example: 'Linha infantil atualizada' },
          ativo: { type: 'boolean', example: true },
        },
      },
      Produto: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '22222222-2222-4222-8222-222222222222' },
          categoria_id: { type: 'string', format: 'uuid', example: '11111111-1111-4111-8111-111111111111' },
          nome: { type: 'string', example: 'EscovaMax Kids' },
          descricao: { type: 'string', example: 'Escova infantil com cabo antiderrapante e cabeça pequena' },
          tipo_cerdas: { type: 'string', enum: ['macia', 'media', 'dura'], example: 'macia' },
          quantidade_estoque: { type: 'integer', minimum: 0, example: 500 },
          estoque_minimo: { type: 'integer', minimum: 0, example: 100 },
          preco_unitario: { type: 'number', format: 'float', exclusiveMinimum: 0, example: 8.9 },
          ativo: { type: 'boolean', example: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      CriarProduto: {
        type: 'object',
        required: [
          'categoria_id',
          'nome',
          'descricao',
          'tipo_cerdas',
          'quantidade_estoque',
          'estoque_minimo',
          'preco_unitario',
        ],
        properties: {
          categoria_id: { type: 'string', format: 'uuid', example: '11111111-1111-4111-8111-111111111111' },
          nome: { type: 'string', example: 'EscovaMax Kids' },
          descricao: { type: 'string', example: 'Escova infantil com cabo antiderrapante' },
          tipo_cerdas: { type: 'string', enum: ['macia', 'media', 'dura'], example: 'macia' },
          quantidade_estoque: { type: 'integer', minimum: 0, example: 500 },
          estoque_minimo: { type: 'integer', minimum: 0, example: 100 },
          preco_unitario: { type: 'number', example: 8.9 },
          ativo: { type: 'boolean', default: true, example: true },
        },
      },
      AtualizarProduto: {
        type: 'object',
        properties: {
          categoria_id: { type: 'string', format: 'uuid' },
          nome: { type: 'string', example: 'EscovaMax Kids Pro' },
          descricao: { type: 'string', example: 'Descrição atualizada' },
          tipo_cerdas: { type: 'string', enum: ['macia', 'media', 'dura'] },
          quantidade_estoque: { type: 'integer', minimum: 0, example: 450 },
          estoque_minimo: { type: 'integer', minimum: 0, example: 80 },
          preco_unitario: { type: 'number', example: 9.5 },
          ativo: { type: 'boolean', example: true },
        },
      },
      MovimentarEstoque: {
        type: 'object',
        required: ['variacao'],
        properties: {
          variacao: {
            type: 'integer',
            description: 'Valor inteiro positivo para entrada ou negativo para saída de estoque (RN01).',
            example: -5,
          },
        },
      },
      PedidoReposicao: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '44444444-4444-4444-8444-444444444444' },
          produto_id: { type: 'string', format: 'uuid', example: '22222222-2222-4222-8222-222222222222' },
          quantidade_solicitada: { type: 'integer', minimum: 1, example: 200 },
          quantidade_recebida: { type: 'integer', nullable: true, example: 200 },
          status: {
            type: 'string',
            enum: ['pendente', 'aprovado', 'recebido', 'cancelado'],
            example: 'pendente',
          },
          fornecedor: { type: 'string', example: 'DenteCerto Distribuidora Ltda.' },
          observacoes: { type: 'string', nullable: true, example: 'Entrega urgente' },
          data_solicitacao: { type: 'string', format: 'date-time' },
          data_recebimento: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      CriarPedidoReposicao: {
        type: 'object',
        required: ['produto_id', 'quantidade_solicitada', 'fornecedor'],
        properties: {
          produto_id: { type: 'string', format: 'uuid', example: '22222222-2222-4222-8222-222222222222' },
          quantidade_solicitada: { type: 'integer', minimum: 1, example: 200 },
          fornecedor: { type: 'string', example: 'DenteCerto Distribuidora Ltda.' },
          observacoes: { type: 'string', example: 'Entrega urgente, estoque crítico' },
        },
      },
      AtualizarPedidoReposicao: {
        type: 'object',
        properties: {
          quantidade_solicitada: { type: 'integer', minimum: 1, example: 250 },
          quantidade_recebida: { type: 'integer', minimum: 1, example: 200 },
          status: {
            type: 'string',
            enum: ['pendente', 'aprovado', 'recebido', 'cancelado'],
            example: 'recebido',
          },
          fornecedor: { type: 'string', example: 'DenteCerto Distribuidora Ltda.' },
          observacoes: { type: 'string', example: 'Recebimento integral' },
        },
      },
      ReceberPedidoReposicao: {
        type: 'object',
        properties: {
          quantidade_recebida: {
            type: 'integer',
            minimum: 1,
            description: 'Opcional. Quando omitido, utiliza a quantidade_solicitada do pedido.',
            example: 200,
          },
        },
      },
    },
  },
  paths: {
    '/': {
      get: {
        tags: ['Sistema'],
        summary: 'Verificar status da API',
        responses: {
          200: { description: 'API em funcionamento.' },
        },
      },
    },
    '/categorias': {
      get: {
        tags: ['Categorias'],
        summary: 'Listar categorias',
        description: 'Retorna todas as categorias cadastradas ordenadas por nome.',
        responses: {
          200: {
            description: 'Lista de categorias retornada com sucesso.',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Categoria' } },
              },
            },
          },
          500: { description: 'Erro interno do servidor.' },
        },
      },
      post: {
        tags: ['Categorias'],
        summary: 'Cadastrar categoria',
        description: 'Cria uma nova categoria de escovas.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CriarCategoria' },
            },
          },
        },
        responses: {
          201: {
            description: 'Categoria criada com sucesso.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Categoria' },
              },
            },
          },
          400: { description: 'Dados obrigatórios ausentes ou inválidos.' },
          500: { description: 'Erro interno do servidor.' },
        },
      },
    },
    '/categorias/{id}': {
      get: {
        tags: ['Categorias'],
        summary: 'Consultar categoria por ID',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
            description: 'UUID da categoria',
          },
        ],
        responses: {
          200: {
            description: 'Categoria encontrada.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Categoria' } },
            },
          },
          400: { description: 'UUID inválido.' },
          404: { description: 'Categoria não encontrada.' },
        },
      },
      put: {
        tags: ['Categorias'],
        summary: 'Atualizar categoria',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AtualizarCategoria' } },
          },
        },
        responses: {
          200: {
            description: 'Categoria atualizada com sucesso.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Categoria' } },
            },
          },
          400: { description: 'Requisição ou UUID inválido.' },
          404: { description: 'Categoria não encontrada.' },
        },
      },
      delete: {
        tags: ['Categorias'],
        summary: 'Excluir categoria',
        description: 'Remove uma categoria desde que não possua produtos vinculados.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          204: { description: 'Categoria excluída com sucesso.' },
          400: { description: 'UUID inválido.' },
          404: { description: 'Categoria não encontrada.' },
          409: { description: 'Conflito: categoria possui produtos vinculados.' },
        },
      },
    },
    '/produtos': {
      get: {
        tags: ['Produtos'],
        summary: 'Listar produtos',
        description: 'Lista todos os produtos (escovas), com filtros opcionais por categoria e estoque baixo.',
        parameters: [
          {
            name: 'categoria_id',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'uuid' },
            description: 'Filtra produtos por UUID da categoria',
          },
          {
            name: 'estoque_baixo',
            in: 'query',
            required: false,
            schema: { type: 'boolean' },
            description: 'Quando true, retorna apenas produtos com estoque <= estoque_minimo',
          },
        ],
        responses: {
          200: {
            description: 'Lista de produtos retornada com sucesso.',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Produto' } },
              },
            },
          },
          400: { description: 'Parâmetro categoria_id inválido.' },
        },
      },
      post: {
        tags: ['Produtos'],
        summary: 'Cadastrar produto',
        description: 'Cadastra uma nova escova aplicando a RN01 (impede estoque negativo ou não inteiro).',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CriarProduto' } },
          },
        },
        responses: {
          201: {
            description: 'Produto criado com sucesso.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Produto' } },
            },
          },
          400: { description: 'Campos obrigatórios ausentes ou UUID inválido.' },
          404: { description: 'Categoria informada não encontrada.' },
          422: { description: 'Dados semanticamente inválidos (ex.: estoque negativo ou não inteiro — RN01).' },
        },
      },
    },
    '/produtos/{id}': {
      get: {
        tags: ['Produtos'],
        summary: 'Consultar produto por ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: {
            description: 'Produto encontrado.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Produto' } },
            },
          },
          400: { description: 'UUID inválido.' },
          404: { description: 'Produto não encontrado.' },
        },
      },
      put: {
        tags: ['Produtos'],
        summary: 'Atualizar produto',
        description: 'Atualiza dados do produto respeitando a RN01 (impede estoque negativo).',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AtualizarProduto' } },
          },
        },
        responses: {
          200: {
            description: 'Produto atualizado com sucesso.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Produto' } },
            },
          },
          400: { description: 'Requisição inválida.' },
          404: { description: 'Produto ou categoria não encontrada.' },
          422: { description: 'Estoque negativo, não inteiro ou preço inválido (RN01).' },
        },
      },
      delete: {
        tags: ['Produtos'],
        summary: 'Excluir produto',
        description: 'Remove um produto aplicando a RN03 (impede exclusão se houver pedidos de reposição vinculados).',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          204: { description: 'Produto excluído com sucesso.' },
          400: { description: 'UUID inválido.' },
          404: { description: 'Produto não encontrado.' },
          409: { description: 'Conflito (RN03): produto possui pedidos de reposição vinculados.' },
        },
      },
    },
    '/produtos/{id}/estoque': {
      patch: {
        tags: ['Produtos'],
        summary: 'Movimentar estoque do produto (RN01)',
        description: 'Adiciona ou retira unidades inteiras do estoque, rejeitando operações que resultem em saldo negativo.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/MovimentarEstoque' } },
          },
        },
        responses: {
          200: {
            description: 'Estoque movimentado com sucesso.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Produto' } },
            },
          },
          400: { description: 'UUID inválido.' },
          404: { description: 'Produto não encontrado.' },
          422: { description: 'Estoque insuficiente ou variação inválida (RN01).' },
        },
      },
    },
    '/pedidos-reposicao': {
      get: {
        tags: ['Pedidos de Reposição'],
        summary: 'Listar pedidos de reposição',
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['pendente', 'aprovado', 'recebido', 'cancelado'] },
          },
          {
            name: 'produto_id',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Lista de pedidos retornada com sucesso.',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/PedidoReposicao' } },
              },
            },
          },
          400: { description: 'Parâmetro produto_id inválido.' },
          422: { description: 'Parâmetro status inválido.' },
        },
      },
      post: {
        tags: ['Pedidos de Reposição'],
        summary: 'Criar pedido de reposição',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CriarPedidoReposicao' } },
          },
        },
        responses: {
          201: {
            description: 'Pedido criado com sucesso com status pendente.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/PedidoReposicao' } },
            },
          },
          400: { description: 'Campos obrigatórios ausentes ou inválidos.' },
          404: { description: 'Produto informado não encontrado.' },
          422: { description: 'Quantidade solicitada deve ser inteira positiva.' },
        },
      },
    },
    '/pedidos-reposicao/{id}': {
      get: {
        tags: ['Pedidos de Reposição'],
        summary: 'Consultar pedido de reposição por ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: {
            description: 'Pedido encontrado.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/PedidoReposicao' } },
            },
          },
          400: { description: 'UUID inválido.' },
          404: { description: 'Pedido não encontrado.' },
        },
      },
      put: {
        tags: ['Pedidos de Reposição'],
        summary: 'Atualizar pedido de reposição',
        description:
          'Atualiza um pedido pendente. Quando status="recebido", executa o recebimento atômico conforme RN02.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AtualizarPedidoReposicao' } },
          },
        },
        responses: {
          200: {
            description: 'Pedido atualizado com sucesso.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/PedidoReposicao' } },
            },
          },
          400: { description: 'Requisição inválida.' },
          404: { description: 'Pedido não encontrado.' },
          409: { description: 'Conflito (RN02): pedido já recebido, cancelado ou com status inválido.' },
          422: { description: 'Dados semanticamente inválidos.' },
        },
      },
      delete: {
        tags: ['Pedidos de Reposição'],
        summary: 'Excluir pedido de reposição',
        description: 'Remove um pedido desde que não esteja com status recebido.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          204: { description: 'Pedido excluído com sucesso.' },
          400: { description: 'UUID inválido.' },
          404: { description: 'Pedido não encontrado.' },
          409: { description: 'Conflito: não é possível excluir um pedido já recebido.' },
        },
      },
    },
    '/pedidos-reposicao/{id}/receber': {
      patch: {
        tags: ['Pedidos de Reposição'],
        summary: 'Receber pedido de reposição (RN02)',
        description:
          'Endpoint dedicado para recebimento único e transacional de pedidos pendentes. Atualiza status e incrementa o estoque em uma única transação no Supabase/PostgreSQL.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ReceberPedidoReposicao' } },
          },
        },
        responses: {
          200: {
            description: 'Pedido recebido e estoque incrementado com sucesso.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/PedidoReposicao' } },
            },
          },
          400: { description: 'UUID inválido.' },
          404: { description: 'Pedido não encontrado.' },
          409: { description: 'Conflito (RN02): pedido já recebido, cancelado ou não pendente.' },
          422: { description: 'Quantidade recebida inválida.' },
        },
      },
    },
  },
};
