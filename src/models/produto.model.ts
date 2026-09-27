export interface Produto {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string;
  tipo_cerdas: 'macia' | 'media' | 'dura';
  quantidade_estoque: number;
  estoque_minimo: number;
  preco_unitario: number;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProdutoDTO {
  categoria_id: string;
  nome: string;
  descricao: string;
  tipo_cerdas: 'macia' | 'media' | 'dura';
  quantidade_estoque: number;
  estoque_minimo: number;
  preco_unitario: number;
  ativo?: boolean;
}

export interface UpdateProdutoDTO {
  categoria_id?: string;
  nome?: string;
  descricao?: string;
  tipo_cerdas?: 'macia' | 'media' | 'dura';
  quantidade_estoque?: number;
  estoque_minimo?: number;
  preco_unitario?: number;
  ativo?: boolean;
}
