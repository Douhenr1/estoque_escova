import express from 'express';
import { especificacaoSwagger } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler';
import categoriaRoutes from './routes/categoria.routes';
import pedidoReposicaoRoutes from './routes/pedidoReposicao.routes';
import produtoRoutes from './routes/produto.routes';

const app = express();

app.use(express.json());

const htmlSwagger = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BrushFlow API — Documentação Swagger</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      SwaggerUIBundle({
        url: '/api-docs.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'BaseLayout',
      });
    };
  </script>
</body>
</html>`;

// Documentação interativa Swagger/OpenAPI
app.get('/api-docs.json', (_req, res) => {
  res.status(200).json(especificacaoSwagger);
});

app.get(['/api-docs', '/api-docs/'], (_req, res) => {
  res.status(200).type('html').send(htmlSwagger);
});

// Redireciona a raiz direto para o Swagger
app.get('/', (_req, res) => {
  res.redirect('/api-docs');
});

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    api: 'BrushFlow API',
    versao: '1.1.0',
    descricao: 'API de gestão de estoque e logística de escovas de dentes',
    documentacao: '/api-docs',
    status: 'online',
  });
});

// Rotas da aplicação
app.use('/categorias', categoriaRoutes);
app.use('/produtos', produtoRoutes);
app.use('/pedidos-reposicao', pedidoReposicaoRoutes);

// Rota não encontrada
app.use((_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

// Middleware global de tratamento de erros
app.use(errorHandler);

export default app;
