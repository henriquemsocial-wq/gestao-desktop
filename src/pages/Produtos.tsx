import { useState, useEffect } from 'react';
import { Plus, Search, X, Package, AlertCircle, Download, ArrowUpDown } from 'lucide-react';
import { readCSV, writeCSV } from '../core/csvService';
import { Produto } from '../core/types';
import Papa from 'papaparse';

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState<'az' | 'za'>('az');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estado do formulário com TODOS os novos campos solicitados
  const [formData, setFormData] = useState({
    codigo_barras: '',
    nome: '',
    categoria: '',
    saldo: 0,
    unidade_medida: 'un',
    receita: '',
    custo: 0,
    margem: 0,
    preco: 0,
    fotos: '',
    documentos: ''
  });

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    setIsLoading(true);
    const dados = await readCSV<Produto>('produtos.csv');
    setProdutos(dados || []);
    setIsLoading(false);
  };

  // Lógica de Cálculo Automático: Custo + Margem = Preço Final
  const calcularPrecoFinal = (custo: number, margem: number) => {
    const valorMargem = custo * (margem / 100);
    return custo + valorMargem;
  };

  const handleCustoMargemChange = (campo: 'custo' | 'margem', valor: number) => {
    const novoCusto = campo === 'custo' ? valor : formData.custo;
    const novaMargem = campo === 'margem' ? valor : formData.margem;
    const novoPreco = calcularPrecoFinal(novoCusto, novaMargem);
    
    setFormData({
      ...formData,
      [campo]: valor,
      preco: Number(novoPreco.toFixed(2))
    });
  };

  // Lógica de Busca e Ordenação Alfanumérica
  let produtosProcessados = produtos.filter(p => 
    p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    p.codigo_barras?.includes(busca) ||
    p.categoria?.toLowerCase().includes(busca.toLowerCase())
  );

  produtosProcessados = produtosProcessados.sort((a, b) => {
    // localeCompare com numeric: true garante ordenação alfanumérica correta (ex: Produto 2 vem antes de Produto 10)
    if (ordenacao === 'az') return a.nome.localeCompare(b.nome, undefined, { numeric: true });
    return b.nome.localeCompare(a.nome, undefined, { numeric: true });
  });

  // Exportar para CSV
  const exportarCSV = () => {
    const csv = Papa.unparse(produtosProcessados);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `estoque_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const novoProduto: Produto = {
      id: Date.now().toString(),
      ...formData,
      saldo: Number(formData.saldo),
      custo: Number(formData.custo),
      margem: Number(formData.margem),
      preco: Number(formData.preco)
    };

    const novaLista = [...produtos, novoProduto];
    const sucesso = await writeCSV('produtos.csv', novaLista);
    
    if (sucesso) {
      setProdutos(novaLista);
      setIsModalOpen(false);
      // Reseta o form
      setFormData({ codigo_barras: '', nome: '', categoria: '', saldo: 0, unidade_medida: 'un', receita: '', custo: 0, margem: 0, preco: 0, fotos: '', documentos: '' });
    } else {
      alert('Erro ao salvar o produto no arquivo CSV.');
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Cabeçalho e Botões do Topo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Produtos & Estoque</h1>
          <p className="text-slate-500 text-sm">Gerencie o cadastro e o saldo de produtos salvos localmente</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={exportarCSV}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download size={18} />
            <span>Exportar CSV</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Barra de Ferramentas (Busca e Ordenação) */}
      <div className="flex gap-4 mb-4 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar produto, código ou categoria..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select 
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as 'az' | 'za')}
            className="pl-10 pr-8 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
          >
            <option value="az">Ordenar A-Z</option>
            <option value="za">Ordenar Z-A</option>
          </select>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Código</th>
                <th className="p-4 font-semibold">Produto</th>
                <th className="p-4 font-semibold">Categoria</th>
                <th className="p-4 font-semibold text-center">Saldo</th>
                <th className="p-4 font-semibold text-right">Preço Final</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Carregando dados...</td></tr>
              ) : produtosProcessados.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhum produto encontrado.</td></tr>
              ) : (
                produtosProcessados.map((produto) => (
                  <tr key={produto.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500 font-mono text-sm">{produto.codigo_barras || produto.id.slice(-6)}</td>
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-slate-200">
                        <Package size={16} />
                      </div>
                      <div>
                        <span className="font-medium text-slate-800 block">{produto.nome}</span>
                        <span className="text-xs text-slate-400">{produto.unidade_medida}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{produto.categoria || '-'}</td>
                    <td className="p-4 text-center">
                      {produto.saldo > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {produto.saldo} {produto.unidade_medida}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle size={12} /> Sem estoque
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-800 font-medium text-right">{formatarMoeda(produto.preco)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO (Anti-Overflow) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          {/* max-h-[90vh] garante que o modal nunca ultrapasse 90% da altura da tela */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Cadastrar Novo Produto</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Corpo do Modal (Scrollável) */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form id="form-produto" onSubmit={handleSalvar} className="space-y-6">
                
                {/* Seção 1: Informações Básicas */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 border-b pb-2">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Produto *</label>
                      <input required type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Código de Barras</label>
                      <input type="text" value={formData.codigo_barras} onChange={(e) => setFormData({...formData, codigo_barras: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                      <input type="text" value={formData.categoria} onChange={(e) => setFormData({...formData, categoria: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                </div>

                {/* Seção 2: Estoque e Medidas */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 border-b pb-2">Estoque e Medidas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Saldo Inicial *</label>
                      <input required type="number" min="0" value={formData.saldo} onChange={(e) => setFormData({...formData, saldo: parseInt(e.target.value)})} className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Unidade de Medida *</label>
                      <select value={formData.unidade_medida} onChange={(e) => setFormData({...formData, unidade_medida: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                        <option value="un">Unidade (un)</option>
                        <option value="cx">Caixa (cx)</option>
                        <option value="kg">Quilograma (kg)</option>
                        <option value="g">Grama (g)</option>
                        <option value="L">Litro (L)</option>
                        <option value="ml">Mililitro (ml)</option>
                        <option value="m">Metro (m)</option>
                        <option value="cm">Centímetro (cm)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Receita / Composição (Opcional)</label>
                      <textarea rows={3} value={formData.receita} onChange={(e) => setFormData({...formData, receita: e.target.value})} placeholder="Descreva a receita ou composição deste produto..." className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
                    </div>
                  </div>
                </div>

                {/* Seção 3: Precificação */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 border-b pb-2">Precificação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Custo (R$)</label>
                      <input type="number" step="0.01" min="0" value={formData.custo} onChange={(e) => handleCustoMargemChange('custo', parseFloat(e.target.value) || 0)} className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Margem de Lucro (%)</label>
                      <input type="number" step="0.1" min="0" value={formData.margem} onChange={(e) => handleCustoMargemChange('margem', parseFloat(e.target.value) || 0)} className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Preço Final (R$) *</label>
                      <input required type="number" step="0.01" min="0" value={formData.preco} onChange={(e) => setFormData({...formData, preco: parseFloat(e.target.value) || 0})} className="w-full p-2.5 rounded-lg border border-blue-400 bg-blue-50 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-800" />
                    </div>
                  </div>
                </div>

                {/* Seção 4: Anexos */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 border-b pb-2">Anexos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Fotos do Produto</label>
                      <input type="file" accept="image/*" multiple onChange={(e) => setFormData({...formData, fotos: e.target.files ? e.target.files.length + ' arquivo(s)' : ''})} className="w-full p-2 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Documentos (PDF, DOC)</label>
                      <input type="file" accept=".pdf,.doc,.docx" multiple onChange={(e) => setFormData({...formData, documentos: e.target.files ? e.target.files.length + ' arquivo(s)' : ''})} className="w-full p-2 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Footer do Modal */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="submit" form="form-produto" className="px-5 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg shadow-sm transition-colors">
                Salvar Produto
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}