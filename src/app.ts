import express from 'express';
import categoriaRoutes from './routes/categoria.routes';
import produtoRoutes from './routes/produto.routes';
import pedidoReposicaoRoutes from './routes/pedidoReposicao.routes';

const app = express();

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.status(200).json({
    api: 'BrushFlow API',
    versao: '1.0.0',
    descricao: 'API de gestão de estoque e logística de escovas de dentes',
    status: 'online',
  });
});

// Rotas
app.use('/categorias', categoriaRoutes);
app.use('/produtos', produtoRoutes);
app.use('/pedidos-reposicao', pedidoReposicaoRoutes);

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

export default app;
