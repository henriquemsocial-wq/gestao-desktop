import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle, 
  Clock, 
  X,
  Wallet,
  AlertCircle,
  Trash,
  Copy,
  Repeat
} from 'lucide-react';
import { readCSV, writeCSV } from '../core/csvService';

interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  categoria: string;
  data: string;
  status: 'pago' | 'pendente';
  recorrencia?: string;
}

interface Produto {
  id: string;
  nome: string;
  preco?: number;
  precoVenda?: number;
  precoUnitario?: number;
}

interface ItemCarrinho {
  produtoId: string;
  nome: string;
  preco: number;
  quantidade: number;
}

export default function Financeiro() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'receita' | 'despesa' | 'pendente'>('todos');

  // Modal e Lançamento
  const [modalAberto, setModalAberto] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('receita');
  const [categoria, setCategoria] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'pago' | 'pendente'>('pago');
  const [valorManual, setValorManual] = useState('');
  const [recorrencia, setRecorrencia] = useState('unica');

  // Seleção de Produtos no Modal
  const [itensCarrinho, setItensCarrinho] = useState<ItemCarrinho[]>([]);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('');
  const [quantidadeTemp, setQuantidadeTemp] = useState(1);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const dadosTransacoes = await readCSV<Transacao>('financeiro.csv');
    setTransacoes(dadosTransacoes || []);

    const dadosProdutos = await readCSV<Produto>('produtos.csv');
    setProdutosDisponiveis(dadosProdutos || []);
  };

  // --- LÓGICA CORRIGIDA DO BOTÃO "+" ---
  const adicionarProdutoAoItem = () => {
    if (!produtoSelecionadoId) return;
    
    // O segredo estava aqui: usar toString() para garantir que o ID seja encontrado!
    const prod = produtosDisponiveis.find(p => p.id?.toString() === produtoSelecionadoId?.toString());
    if (!prod) return;

    const precoUnit = Number(prod.preco || prod.precoVenda || prod.precoUnitario || 0);
    const nomeProd = prod.nome || 'Produto';
    const qtd = Number(quantidadeTemp);
    const subtotal = precoUnit * qtd;

    // 1. Adiciona na lista visual (carrinho)
    let novoCarrinho = [...itensCarrinho];
    const existenteIndex = novoCarrinho.findIndex(item => item.produtoId?.toString() === produtoSelecionadoId?.toString());
    
    if (existenteIndex >= 0) {
      novoCarrinho[existenteIndex].quantidade += qtd;
    } else {
      novoCarrinho.push({
        produtoId: prod.id.toString(),
        nome: nomeProd,
        preco: precoUnit,
        quantidade: qtd
      });
    }
    setItensCarrinho(novoCarrinho);

    // 2. Soma o valor na caixinha (Respeitando se você já digitou algo antes)
    const valorAtual = parseFloat(valorManual.replace(',', '.')) || 0;
    const novoValor = valorAtual + subtotal;
    setValorManual(novoValor.toFixed(2).replace('.', ','));

    // 3. Limpa a seleção para o próximo produto
    setProdutoSelecionadoId('');
    setQuantidadeTemp(1);
  };

  // --- LÓGICA CORRIGIDA DA LIXEIRA ---
  const removerItemCarrinho = (index: number) => {
    const itemRemovido = itensCarrinho[index];
    const novoCarrinho = itensCarrinho.filter((_, i) => i !== index);
    setItensCarrinho(novoCarrinho);

    // Subtrai o valor da caixinha
    const valorAtual = parseFloat(valorManual.replace(',', '.')) || 0;
    const subtotalRemovido = itemRemovido.preco * itemRemovido.quantidade;
    const novoValor = Math.max(0, valorAtual - subtotalRemovido);
    setValorManual(novoValor.toFixed(2).replace('.', ','));
  };

  const salvarTransacao = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let descFinal = descricao;
    if (itensCarrinho.length > 0 && !descFinal) {
      descFinal = itensCarrinho.map(i => `${i.quantidade}x ${i.nome}`).join(', ');
    }
    if (!descFinal) descFinal = 'Lançamento Financeiro';

    // Pega o valor exato que está na caixinha (permitindo a sua digitação livre)
    const valorFinal = parseFloat(valorManual.replace(',', '.')) || 0;

    if (valorFinal <= 0) return;

    const novaTransacao: Transacao = {
      id: Date.now().toString(),
      descricao: descFinal,
      valor: valorFinal,
      tipo,
      categoria: categoria || 'Geral',
      data,
      status,
      recorrencia
    };

    const atualizadas = [...transacoes, novaTransacao];
    setTransacoes(atualizadas);
    await writeCSV('financeiro.csv', atualizadas);

    setDescricao('');
    setValorManual('');
    setItensCarrinho([]);
    setCategoria('');
    setRecorrencia('unica');
    setModalAberto(false);
  };

  const excluirTransacao = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este lançamento?")) return;
    const atualizadas = transacoes.filter(t => t.id !== id);
    setTransacoes(atualizadas);
    await writeCSV('financeiro.csv', atualizadas);
  };

  const duplicarTransacao = (t: Transacao) => {
    setDescricao(t.descricao);
    setValorManual(t.valor.toString().replace('.', ','));
    setTipo(t.tipo);
    setCategoria(t.categoria);
    setRecorrencia(t.recorrencia || 'unica');
    setStatus('pendente');
    setData(new Date().toISOString().split('T')[0]);
    setItensCarrinho([]);
    setModalAberto(true);
  };

  const alternarStatus = async (id: string) => {
    const atualizadas = transacoes.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'pago' ? ('pendente' as const) : ('pago' as const) };
      }
      return t;
    });
    setTransacoes(atualizadas);
    await writeCSV('financeiro.csv', atualizadas);
  };

  const totalReceitas = transacoes
    .filter(t => t.tipo === 'receita')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesas = transacoes
    .filter(t => t.tipo === 'despesa')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalPendentes = transacoes
    .filter(t => t.status === 'pendente')
    .reduce((acc, t) => acc + t.valor, 0);

  const saldoTotal = totalReceitas - totalDespesas;

  const transacoesFiltradas = transacoes.filter(t => {
    const matchBusca = t.descricao.toLowerCase().includes(busca.toLowerCase()) || 
                       t.categoria.toLowerCase().includes(busca.toLowerCase());
    
    if (filtroTipo === 'receita') return matchBusca && t.tipo === 'receita';
    if (filtroTipo === 'despesa') return matchBusca && t.tipo === 'despesa';
    if (filtroTipo === 'pendente') return matchBusca && t.status === 'pendente';
    return matchBusca;
  });

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 overflow-hidden">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="text-emerald-600" size={28} /> Gestão Financeira
          </h1>
          <p className="text-slate-500 mt-1">Acompanhe suas receitas, despesas e fluxo de caixa em tempo real</p>
        </div>

        <button
          onClick={() => {
            setItensCarrinho([]);
            setDescricao('');
            setValorManual('');
            setCategoria('');
            setRecorrencia('unica');
            setData(new Date().toISOString().split('T')[0]);
            setModalAberto(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={18} /> Novo Lançamento
        </button>
      </div>

      {/* Cards de Resumo e Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Saldo em Caixa</p>
            <h3 className={`text-2xl font-extrabold ${saldoTotal >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
              R$ {saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <DollarSign size={24} />
          </div>
        </div>

        <div 
          onClick={() => setFiltroTipo(filtroTipo === 'receita' ? 'todos' : 'receita')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
            filtroTipo === 'receita' 
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/30 shadow-md' 
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div>
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">
              <TrendingUp size={14} /> Receitas
            </div>
            <h3 className="text-2xl font-extrabold text-emerald-600">
              R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <span className="text-xs text-emerald-600 font-semibold underline">
            {filtroTipo === 'receita' ? 'Limpar' : 'Filtrar'}
          </span>
        </div>

        <div 
          onClick={() => setFiltroTipo(filtroTipo === 'despesa' ? 'todos' : 'despesa')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
            filtroTipo === 'despesa' 
              ? 'bg-rose-50 border-rose-500 ring-2 ring-rose-400/30 shadow-md' 
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div>
            <div className="flex items-center gap-1 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
              <TrendingDown size={14} /> Despesas
            </div>
            <h3 className="text-2xl font-extrabold text-rose-600">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <span className="text-xs text-rose-600 font-semibold underline">
            {filtroTipo === 'despesa' ? 'Limpar' : 'Filtrar'}
          </span>
        </div>

        <div 
          onClick={() => setFiltroTipo(filtroTipo === 'pendente' ? 'todos' : 'pendente')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
            filtroTipo === 'pendente' 
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/30 shadow-md' 
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div>
            <div className="flex items-center gap-1 text-amber-600 font-bold text-xs uppercase tracking-wider mb-1">
              <AlertCircle size={14} /> Pendentes
            </div>
            <h3 className="text-2xl font-extrabold text-amber-600">
              R$ {totalPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <span className="text-xs text-amber-600 font-semibold underline">
            {filtroTipo === 'pendente' ? 'Limpar' : 'Filtrar'}
          </span>
        </div>

      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-4 shrink-0">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar por descrição ou categoria..." 
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 shadow-sm"
          />
        </div>

        {filtroTipo !== 'todos' && (
          <div className="flex items-center gap-2 bg-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <span>Filtro ativo: <strong className="capitalize">{filtroTipo}</strong></span>
            <button 
              onClick={() => setFiltroTipo('todos')}
              className="text-slate-500 hover:text-slate-900 bg-white rounded-full p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Tabela de Lançamentos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Valor</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transacoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                    Nenhum lançamento encontrado.
                  </td>
                </tr>
              ) : (
                transacoesFiltradas.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 text-sm text-slate-600 font-medium">
                      {/* CORREÇÃO DO BUG INVALID DATE */}
                      {t.data ? (t.data.includes('-') ? t.data.split('-').reverse().join('/') : t.data) : '-'}
                    </td>
                    <td className="p-4 text-sm font-semibold text-slate-800 flex items-center gap-2">
                      {t.descricao}
                      {t.recorrencia && t.recorrencia !== 'unica' && (
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                          <Repeat size={10} /> {t.recorrencia}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg">
                        {t.categoria}
                      </span>
                    </td>
                    <td className={`p-4 text-sm font-black ${t.tipo === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.tipo === 'receita' ? '+' : '-'} R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => alternarStatus(t.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          t.status === 'pago' 
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                        }`}
                      >
                        {t.status === 'pago' ? <CheckCircle size={12} /> : <Clock size={12} />}
                        {t.status === 'pago' ? 'Realizado' : 'Pendente'}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <button 
                        onClick={() => duplicarTransacao(t)}
                        className="text-slate-400 hover:text-emerald-600 p-2 rounded-lg hover:bg-emerald-50 transition-colors inline-block"
                        title="Duplicar"
                      >
                        <Copy size={18} />
                      </button>
                      <button 
                        onClick={() => excluirTransacao(t.id)}
                        className="text-slate-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors inline-block"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NOVO LANÇAMENTO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-xl font-bold text-slate-800">Novo Lançamento Financeiro</h3>
              <button 
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={salvarTransacao} className="space-y-4 overflow-y-auto flex-1 pr-1">
              
              {/* Botões Receita / Despesa */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipo('receita')}
                  className={`py-2.5 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2 ${
                    tipo === 'receita' 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <TrendingUp size={16} /> Receita
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('despesa')}
                  className={`py-2.5 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2 ${
                    tipo === 'despesa' 
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <TrendingDown size={16} /> Despesa
                </button>
              </div>

              {/* Seção de Seleção de Produtos da Lista (Opcional) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Adicionar Produtos da Lista (Opcional)</label>
                <div className="flex gap-2 items-center">
                  <select
                    value={produtoSelecionadoId}
                    onChange={e => setProdutoSelecionadoId(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-xl p-2 text-sm bg-white outline-none focus:border-emerald-500"
                  >
                    <option value="">Selecione um produto...</option>
                    {produtosDisponiveis.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome} — R$ {Number(p.preco || p.precoVenda || p.precoUnitario || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>

                  <input 
                    type="number" 
                    min="1" 
                    value={quantidadeTemp} 
                    onChange={e => setQuantidadeTemp(Number(e.target.value))}
                    className="w-16 border border-slate-300 rounded-xl p-2 text-sm bg-white text-center outline-none"
                    placeholder="Qtd"
                  />

                  <button 
                    type="button"
                    onClick={adicionarProdutoAoItem}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-sm font-bold shrink-0"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {itensCarrinho.length > 0 && (
                  <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                    {itensCarrinho.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200 text-xs">
                        <div>
                          <span className="font-semibold text-slate-800">{item.nome}</span>
                          <span className="text-slate-500 ml-1">({item.quantidade}x R$ {item.preco.toFixed(2)})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-600">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                          <button type="button" onClick={() => removerItemCarrinho(index)} className="text-slate-400 hover:text-rose-600">
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Mensalidade Cliente / Compra de Material" 
                  value={descricao} 
                  onChange={e => setDescricao(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Valor (R$) e Categoria */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor (R$) *</label>
                  <input 
                    type="text" 
                    required
                    value={valorManual} 
                    onChange={e => setValorManual(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Vendas, Aluguel" 
                    value={categoria} 
                    onChange={e => setCategoria(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Data e Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Data</label>
                  <input 
                    type="date" 
                    value={data} 
                    onChange={e => setData(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white"
                  >
                    <option value="pago">Realizado / Pago</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </div>
              </div>

              {/* Recorrência */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Recorrência</label>
                <select 
                  value={recorrencia} 
                  onChange={e => setRecorrencia(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white"
                >
                  <option value="unica">Única</option>
                  <option value="mensal">Mensal</option>
                  <option value="anual">Anual</option>
                  <option value="semanal">Semanal</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
                <button 
                  type="button" 
                  onClick={() => setModalAberto(false)} 
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}