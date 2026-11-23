export interface Categoria {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CriarCategoriaDTO {
  nome: string;
  descricao: string;
  ativo?: boolean;
}

export interface AtualizarCategoriaDTO {
  nome?: string;
  descricao?: string;
  ativo?: boolean;
}

// Aliases mantidos para compatibilidade com referências anteriores
export type CreateCategoriaDTO = CriarCategoriaDTO;
export type UpdateCategoriaDTO = AtualizarCategoriaDTO;

export class CategoriaEntidade implements Categoria {
  public readonly id: string;
  public nome: string;
  public descricao: string;
  public ativo: boolean;
  public readonly created_at?: string;
  public updated_at?: string;

  constructor(dados: Categoria) {
    this.id = dados.id;
    this.nome = dados.nome;
    this.descricao = dados.descricao;
    this.ativo = dados.ativo;
    this.created_at = dados.created_at;
    this.updated_at = dados.updated_at;
  }

  public estaAtiva(): boolean {
    return this.ativo;
  }

  public paraObjeto(): Categoria {
    return {
      id: this.id,
      nome: this.nome,
      descricao: this.descricao,
      ativo: this.ativo,
      ...(this.created_at !== undefined ? { created_at: this.created_at } : {}),
      ...(this.updated_at !== undefined ? { updated_at: this.updated_at } : {}),
    };
  }
}
