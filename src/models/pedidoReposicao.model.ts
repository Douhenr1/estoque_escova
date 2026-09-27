export interface PedidoReposicao {
  id: string;
  produto_id: string;
  quantidade_solicitada: number;
  quantidade_recebida?: number;
  status: 'pendente' | 'aprovado' | 'recebido' | 'cancelado';
  fornecedor: string;
  observacoes?: string;
  data_solicitacao?: string;
  data_recebimento?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePedidoReposicaoDTO {
  produto_id: string;
  quantidade_solicitada: number;
  fornecedor: string;
  observacoes?: string;
}

export interface UpdatePedidoReposicaoDTO {
  quantidade_solicitada?: number;
  quantidade_recebida?: number;
  status?: 'pendente' | 'aprovado' | 'recebido' | 'cancelado';
  fornecedor?: string;
  observacoes?: string;
  data_recebimento?: string;
}
