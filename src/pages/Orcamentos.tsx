import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, X, FileText, Trash2, ShoppingCart, Edit, FileDown } from 'lucide-react';
import { readCSV, writeCSV } from '../core/csvService';
import { Orcamento, Cliente, Produto } from '../core/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ItemCarrinho {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  
  const [busca, setBusca] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [orcamentoEditando, setOrcamentoEditando] = useState<string | null>(null);

  // Estados do Formulário
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [observacao, setObservacao] = useState('');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  
  // Estados de Adição de Produto
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [precoEditavel, setPrecoEditavel] = useState<number>(0);

  useEffect(() => {
    carregarDados();
  }, []);

  // Quando o usuário seleciona um produto, puxa o preço padrão dele para o campo editável
  useEffect(() => {
    const prod = produtos.find(p => String(p.id) === String(produtoSelecionado));
    if (prod) {
      setPrecoEditavel(Number(prod.preco) || 0);
    } else {
      setPrecoEditavel(0);
    }
  }, [produtoSelecionado, produtos]);

  const carregarDados = async () => {
    setIsLoading(true);
    const [dadosOrcamentos, dadosClientes, dadosProdutos] = await Promise.all([
      readCSV<Orcamento>('orcamentos.csv'),
      readCSV<Cliente>('clientes.csv'),
      readCSV<Produto>('produtos.csv')
    ]);
    
    setOrcamentos(dadosOrcamentos || []);
    setClientes(dadosClientes || []);
    setProdutos(dadosProdutos || []);
    setIsLoading(false);
  };

  const getNomeCliente = (id: string) => {
    if (!id) return 'Cliente não informado';
    const cliente = clientes.find(c => String(c.id) === String(id));
    return cliente ? cliente.nome : 'Cliente não encontrado';
  };

  // Lógica Otimizada e Segura de Filtros (Impede quebras se os dados estiverem vazios)
  const orcamentosFiltrados = useMemo(() => {
    return orcamentos.filter(o => {
      const termoBusca = String(busca || '').toLowerCase();
      const numeroOrc = String(o.numero || '').toLowerCase();
      const nomeCli = String(getNomeCliente(o.cliente_id) || '').toLowerCase();
      
      return numeroOrc.includes(termoBusca) || nomeCli.includes(termoBusca);
    }).sort((a, b) => {
      // Ordena mostrando os orçamentos mais recentes primeiro
      return new Date(b.data).getTime() - new Date(a.data).getTime();
    });
  }, [orcamentos, busca, clientes]);

  // --- LÓGICA DO CARRINHO ---
  const adicionarAoCarrinho = () => {
    const prod = produtos.find(p => String(p.id) === String(produtoSelecionado));
    
    if (!prod || quantidade <= 0) {
      alert("Selecione um produto e informe uma quantidade válida.");
      return;
    }

    const novoItem: ItemCarrinho = {
      produtoId: String(prod.id),
      nome: prod.nome,
      quantidade: Number(quantidade),
      precoUnitario: Number(precoEditavel),
      subtotal: Number(precoEditavel) * Number(quantidade)
    };

    setCarrinho([...carrinho, novoItem]);
    setProdutoSelecionado('');
    setQuantidade(1);
    setPrecoEditavel(0);
  };

  const removerDoCarrinho = (index: number) => {
    const novoCarrinho = [...carrinho];
    novoCarrinho.splice(index, 1);
    setCarrinho(novoCarrinho);
  };

  const valorTotalCarrinho = carrinho.reduce((acc, item) => acc + item.subtotal, 0);

  // --- ABRIR MODAL ---
  const abrirModalNovo = () => {
    setOrcamentoEditando(null);
    setClienteSelecionado('');
    setObservacao('');
    setCarrinho([]);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (orc: Orcamento) => {
    setOrcamentoEditando(orc.numero);
    setClienteSelecionado(orc.cliente_id ? String(orc.cliente_id) : '');
    setObservacao(orc.observacao || '');
    
    try {
      const itensSalvos = orc.itens ? JSON.parse(orc.itens) : [];
      setCarrinho(itensSalvos);
    } catch (e) {
      setCarrinho([]);
    }
    
    setIsModalOpen(true);
  };

  // --- ALTERAR STATUS NA LINHA DA TABELA ---
  const alterarStatus = async (numeroOrcamento: string, novoStatus: string) => {
    const novaLista = orcamentos.map(orc => {
      if (orc.numero === numeroOrcamento) {
        return { ...orc, status: novoStatus } as Orcamento;
      }
      return orc;
    });

    const sucesso = await writeCSV('orcamentos.csv', novaLista);
    if (sucesso) {
      setOrcamentos(novaLista);
    } else {
      alert('Erro ao atualizar o status.');
    }
  };

  // --- SALVAR ORÇAMENTO ---
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clienteSelecionado) return alert('Selecione um cliente!');
    if (carrinho.length === 0) return alert('Adicione pelo menos um produto!');

    let novaLista = [...orcamentos];

    if (orcamentoEditando) {
      novaLista = novaLista.map(orc => {
        if (orc.numero === orcamentoEditando) {
          return {
            ...orc,
            cliente_id: clienteSelecionado,
            total: valorTotalCarrinho,
            itens: JSON.stringify(carrinho),
            observacao: observacao
          };
        }
        return orc;
      });
    } else {
      const novoOrcamento: Orcamento = {
        numero: `ORC-${Math.floor(Date.now() / 1000)}`,
        cliente_id: clienteSelecionado,
        data: new Date().toISOString().split('T')[0],
        status: 'Rascunho' as any,
        total: valorTotalCarrinho,
        itens: JSON.stringify(carrinho),
        observacao: observacao
      };
      novaLista.push(novoOrcamento);
    }

    const sucesso = await writeCSV('orcamentos.csv', novaLista);
    
    if (sucesso) {
      setOrcamentos(novaLista);
      setIsModalOpen(false);
    } else {
      alert('Erro ao salvar o orçamento.');
    }
  };

  // --- GERAR PDF ---
  const gerarPDF = (orc: Orcamento) => {
    const cliente = clientes.find(c => String(c.id) === String(orc.cliente_id));
    let itens: ItemCarrinho[] = [];
    try { itens = orc.itens ? JSON.parse(orc.itens) : []; } catch (e) {}

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('ORÇAMENTO', 14, 22);
    doc.setFontSize(10);
    doc.text(`Número: ${orc.numero}`, 14, 30);
    
    // Formatação de data segura para o PDF
    const dataFormatada = orc.data ? orc.data.split('-').reverse().join('/') : '-';
    doc.text(`Data: ${dataFormatada}`, 14, 35);
    doc.text(`Status: ${orc.status || 'Não definido'}`, 14, 40);

    doc.setFontSize(12);
    doc.text('Dados do Cliente', 14, 55);
    doc.setFontSize(10);
    doc.text(`Nome: ${cliente?.nome || 'Não informado'}`, 14, 62);
    doc.text(`Documento: ${cliente?.documento || 'Não informado'}`, 14, 67);
    doc.text(`Telefone: ${cliente?.telefone || 'Não informado'}`, 14, 72);

    const tableData = itens.map(item => [
      item.nome,
      item.quantidade.toString(),
      formatarMoeda(item.precoUnitario),
      formatarMoeda(item.subtotal)
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['Produto', 'Qtd', 'Vlr. Unitário', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    let finalY = (doc as any).lastAutoTable.finalY || 85;
    
    doc.setFontSize(14);
    doc.text(`Total Geral: ${formatarMoeda(orc.total)}`, 14, finalY + 15);

    if (orc.observacao) {
      doc.setFontSize(10);
      doc.text('Observações:', 14, finalY + 30);
      doc.setFont('helvetica', 'italic');
      doc.text(orc.observacao, 14, finalY + 37, { maxWidth: 180 });
    }

    doc.save(`${orc.numero || 'orcamento'}.pdf`);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  // Formatar a data para a tabela
  const formatarDataTabela = (dataString: string) => {
    if (!dataString) return '-';
    // O split/reverse/join previne o erro de fuso horário ao mostrar a data local
    return dataString.split('-').reverse().join('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprovado': return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Orçamentos & Vendas</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por número ou cliente..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            onClick={abrirModalNovo}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm shrink-0"
          >
            <Plus size={20} />
            <span>Novo Orçamento</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Número</th>
                <th className="p-4 font-semibold">Cliente</th>
                <th className="p-4 font-semibold">Data</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Total</th>
                <th className="p-4 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Carregando dados...</td></tr>
              ) : orcamentosFiltrados.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhum orçamento encontrado.</td></tr>
              ) : (
                orcamentosFiltrados.map((orc, index) => (
                  <tr key={orc.numero || index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                        <FileText size={16} />
                      </div>
                      <span className="font-medium text-slate-800">{orc.numero}</span>
                    </td>
                    <td className="p-4 text-slate-600">{getNomeCliente(orc.cliente_id)}</td>
                    <td className="p-4 text-slate-600">{formatarDataTabela(orc.data)}</td>
                    <td className="p-4">
                      {/* DROPDOWN DE STATUS NA LINHA DA TABELA */}
                      <select 
                        value={orc.status}
                        onChange={(e) => alterarStatus(orc.numero, e.target.value)}
                        className={`text-xs font-bold rounded-full px-3 py-1 outline-none border cursor-pointer appearance-none ${getStatusColor(orc.status)}`}
                      >
                        <option value="Rascunho">Rascunho</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </td>
                    <td className="p-4 text-slate-800 font-bold text-right">{formatarMoeda(orc.total)}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => abrirModalEditar(orc)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => gerarPDF(orc)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Exportar PDF">
                          <FileDown size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE ORÇAMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart size={24} className="text-blue-600" />
                {orcamentoEditando ? `Editar Orçamento (${orcamentoEditando})` : 'Criar Novo Orçamento'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="form-orcamento" onSubmit={handleSalvar} className="space-y-6">
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
                  <select required value={clienteSelecionado} onChange={(e) => setClienteSelecionado(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">Selecione um cliente...</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>

                <hr className="border-slate-100" />

                {/* ADICIONAR PRODUTOS COM PREÇO EDITÁVEL */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Adicionar Produtos</label>
                  <div className="flex flex-wrap sm:flex-nowrap gap-2 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <select value={produtoSelecionado} onChange={(e) => setProdutoSelecionado(e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                        <option value="">Selecione um produto...</option>
                        {produtos.map(p => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">R$</span>
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          value={precoEditavel} 
                          onChange={(e) => setPrecoEditavel(Number(e.target.value))}
                          className="w-24 p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                          title="Preço Unitário"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">Qtd:</span>
                        <input 
                          type="number" 
                          min="1" 
                          value={quantidade} 
                          onChange={(e) => setQuantidade(Number(e.target.value))}
                          className="w-20 p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <button type="button" onClick={adicionarAoCarrinho} className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                      Add
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="p-3 font-medium">Produto</th>
                        <th className="p-3 font-medium text-center">Qtd</th>
                        <th className="p-3 font-medium text-right">Vlr. Unitário</th>
                        <th className="p-3 font-medium text-right">Subtotal</th>
                        <th className="p-3 font-medium text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {carrinho.length === 0 ? (
                        <tr><td colSpan={5} className="p-4 text-center text-slate-500">Nenhum produto adicionado.</td></tr>
                      ) : (
                        carrinho.map((item, index) => (
                          <tr key={index} className="border-t border-slate-200 bg-white">
                            <td className="p-3 text-slate-800">{item.nome}</td>
                            <td className="p-3 text-center text-slate-600">{item.quantidade}</td>
                            <td className="p-3 text-right text-slate-600">{formatarMoeda(item.precoUnitario)}</td>
                            <td className="p-3 text-right font-medium text-slate-800">{formatarMoeda(item.subtotal)}</td>
                            <td className="p-3 text-center">
                              <button type="button" onClick={() => removerDoCarrinho(index)} className="text-red-500 hover:text-red-700 p-1">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* CAMPO DE OBSERVAÇÃO */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observações (Aparecerá no PDF)</label>
                  <textarea 
                    rows={3} 
                    value={observacao} 
                    onChange={(e) => setObservacao(e.target.value)} 
                    placeholder="Condições de pagamento, prazo de entrega, etc..." 
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  ></textarea>
                </div>

              </form>
            </div>

            <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="text-slate-500">
                Total do Orçamento: <br/>
                <span className="text-2xl font-bold text-blue-600">{formatarMoeda(valorTotalCarrinho)}</span>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" form="form-orcamento" className="px-6 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
                  {orcamentoEditando ? 'Salvar Alterações' : 'Salvar Orçamento'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}