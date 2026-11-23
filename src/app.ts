import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { especificacaoSwagger } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler';
import categoriaRoutes from './routes/categoria.routes';
import pedidoReposicaoRoutes from './routes/pedidoReposicao.routes';
import produtoRoutes from './routes/produto.routes';

const app = express();

app.use(express.json());

// Documentação interativa Swagger/OpenAPI
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(especificacaoSwagger, {
    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui.min.css',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.17.14/swagger-ui-standalone-preset.min.js',
    ],
  })
);
app.get('/api-docs.json', (_req, res) => {
  res.status(200).json(especificacaoSwagger);
});

// Health check
app.get('/', (_req, res) => {
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
