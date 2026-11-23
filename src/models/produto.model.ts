export type TipoCerdas = 'macia' | 'media' | 'dura';

export const TIPOS_CERDAS_VALIDOS: readonly TipoCerdas[] = ['macia', 'media', 'dura'];

export interface Produto {
  id: string;
  categoria_id: string;
  nome: string;
  descricao: string;
  tipo_cerdas: TipoCerdas;
  quantidade_estoque: number;
  estoque_minimo: number;
  preco_unitario: number;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
  categorias?: { nome: string } | null;
}

export interface CriarProdutoDTO {
  categoria_id: string;
  nome: string;
  descricao: string;
  tipo_cerdas: TipoCerdas;
  quantidade_estoque: number;
  estoque_minimo: number;
  preco_unitario: number;
  ativo?: boolean;
}

export interface AtualizarProdutoDTO {
  categoria_id?: string;
  nome?: string;
  descricao?: string;
  tipo_cerdas?: TipoCerdas;
  quantidade_estoque?: number;
  estoque_minimo?: number;
  preco_unitario?: number;
  ativo?: boolean;
}

export interface FiltrosProdutoDTO {
  categoria_id?: string;
  estoque_baixo?: boolean;
}

export interface MovimentarEstoqueDTO {
  variacao: number;
}

// Aliases mantidos para compatibilidade com referências anteriores
export type CreateProdutoDTO = CriarProdutoDTO;
export type UpdateProdutoDTO = AtualizarProdutoDTO;

export class ProdutoEntidade implements Produto {
  public readonly id: string;
  public categoria_id: string;
  public nome: string;
  public descricao: string;
  public tipo_cerdas: TipoCerdas;
  public quantidade_estoque: number;
  public estoque_minimo: number;
  public preco_unitario: number;
  public ativo: boolean;
  public readonly created_at?: string;
  public updated_at?: string;
  public categorias?: { nome: string } | null;

  constructor(dados: Produto) {
    this.id = dados.id;
    this.categoria_id = dados.categoria_id;
    this.nome = dados.nome;
    this.descricao = dados.descricao;
    this.tipo_cerdas = dados.tipo_cerdas;
    this.quantidade_estoque = dados.quantidade_estoque;
    this.estoque_minimo = dados.estoque_minimo;
    this.preco_unitario = dados.preco_unitario;
    this.ativo = dados.ativo;
    this.created_at = dados.created_at;
    this.updated_at = dados.updated_at;
    this.categorias = dados.categorias;
  }

  public estaComEstoqueBaixo(): boolean {
    return this.quantidade_estoque <= this.estoque_minimo;
  }

  public podeMovimentarEstoque(variacao: number): boolean {
    return Number.isInteger(variacao) && this.quantidade_estoque + variacao >= 0;
  }

  public paraObjeto(): Produto {
    return {
      id: this.id,
      categoria_id: this.categoria_id,
      nome: this.nome,
      descricao: this.descricao,
      tipo_cerdas: this.tipo_cerdas,
      quantidade_estoque: this.quantidade_estoque,
      estoque_minimo: this.estoque_minimo,
      preco_unitario: this.preco_unitario,
      ativo: this.ativo,
      ...(this.created_at !== undefined ? { created_at: this.created_at } : {}),
      ...(this.updated_at !== undefined ? { updated_at: this.updated_at } : {}),
      ...(this.categorias !== undefined ? { categorias: this.categorias } : {}),
    };
  }
}
