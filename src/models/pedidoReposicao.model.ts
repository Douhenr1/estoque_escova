export type StatusPedidoReposicao = 'pendente' | 'aprovado' | 'recebido' | 'cancelado';

export const STATUS_PEDIDO_VALIDOS: readonly StatusPedidoReposicao[] = [
  'pendente',
  'aprovado',
  'recebido',
  'cancelado',
];

export interface PedidoReposicao {
  id: string;
  produto_id: string;
  quantidade_solicitada: number;
  quantidade_recebida?: number | null;
  status: StatusPedidoReposicao;
  fornecedor: string;
  observacoes?: string | null;
  data_solicitacao?: string;
  data_recebimento?: string | null;
  created_at?: string;
  updated_at?: string;
  produtos?: {
    nome: string;
    quantidade_estoque: number;
    estoque_minimo: number;
  } | null;
}

export interface CriarPedidoReposicaoDTO {
  produto_id: string;
  quantidade_solicitada: number;
  fornecedor: string;
  observacoes?: string;
}

export interface AtualizarPedidoReposicaoDTO {
  quantidade_solicitada?: number;
  quantidade_recebida?: number;
  status?: StatusPedidoReposicao;
  fornecedor?: string;
  observacoes?: string;
  data_recebimento?: string;
}

export interface ReceberPedidoReposicaoDTO {
  quantidade_recebida?: number;
}

export interface FiltrosPedidoReposicaoDTO {
  status?: StatusPedidoReposicao;
  produto_id?: string;
}

// Aliases mantidos para compatibilidade com referências anteriores
export type CreatePedidoReposicaoDTO = CriarPedidoReposicaoDTO;
export type UpdatePedidoReposicaoDTO = AtualizarPedidoReposicaoDTO;

export class PedidoReposicaoEntidade implements PedidoReposicao {
  public readonly id: string;
  public produto_id: string;
  public quantidade_solicitada: number;
  public quantidade_recebida?: number | null;
  public status: StatusPedidoReposicao;
  public fornecedor: string;
  public observacoes?: string | null;
  public readonly data_solicitacao?: string;
  public data_recebimento?: string | null;
  public readonly created_at?: string;
  public updated_at?: string;
  public produtos?: {
    nome: string;
    quantidade_estoque: number;
    estoque_minimo: number;
  } | null;

  constructor(dados: PedidoReposicao) {
    this.id = dados.id;
    this.produto_id = dados.produto_id;
    this.quantidade_solicitada = dados.quantidade_solicitada;
    this.quantidade_recebida = dados.quantidade_recebida;
    this.status = dados.status;
    this.fornecedor = dados.fornecedor;
    this.observacoes = dados.observacoes;
    this.data_solicitacao = dados.data_solicitacao;
    this.data_recebimento = dados.data_recebimento;
    this.created_at = dados.created_at;
    this.updated_at = dados.updated_at;
    this.produtos = dados.produtos;
  }

  public podeSerRecebido(): boolean {
    return this.status === 'pendente';
  }

  public podeSerAlterado(): boolean {
    return this.status !== 'recebido' && this.status !== 'cancelado';
  }

  public podeSerExcluido(): boolean {
    return this.status !== 'recebido';
  }
}
