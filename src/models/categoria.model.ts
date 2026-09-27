export interface Categoria {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCategoriaDTO {
  nome: string;
  descricao: string;
  ativo?: boolean;
}

export interface UpdateCategoriaDTO {
  nome?: string;
  descricao?: string;
  ativo?: boolean;
}
