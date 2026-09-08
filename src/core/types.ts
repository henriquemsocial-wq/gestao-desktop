// Estruturas de dados baseadas nos módulos do PDF

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  documento: string;
  data_cadastro: string;
}

export interface Produto {
  id: string;
  codigo_barras: string;
  nome: string;
  categoria: string;
  saldo: number;
  // Novos campos adicionados:
  unidade_medida: string;
  receita: string;
  custo: number;
  margem: number;
  preco: number; // Preço final
  fotos: string; // Guardaremos os nomes dos arquivos separados por vírgula
  documentos: string; 
}

export interface Orcamento {
  numero: string;
  cliente_id: string;
  data: string;
  status: 'Rascunho' | 'Aprovado' | 'Cancelado';
  total: number;
  itens: string; // NOVO: Vai guardar a lista de produtos do carrinho
}
export interface Orcamento {
  numero: string;
  cliente_id: string;
  data: string;
  status: 'Rascunho' | 'Aprovado' | 'Cancelado';
  total: number;
  itens: string;
  observacao: string; // NOVO CAMPO
}
export interface Orcamento {
  numero: string;
  cliente_id: string;
  data: string;
  status: 'Rascunho' | 'Aprovado' | 'Cancelado';
  total: number;
  itens: string;
  observacao: string; // NOVO CAMPO
}
export interface Lancamento {
  id: string;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  data_vencimento: string;
  categoria: string;
  forma_pagamento: string;
  recorrencia: string;
  cliente: string;
  status: 'Pendente' | 'Pago';
}