import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Users, 
  Plus, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  TrendingUp, 
  Trash2, 
  Eye, 
  X,
  Pencil
} from 'lucide-react';
import { readCSV, writeCSV } from '../core/csvService';

interface Persona {
  id: string;
  nomePersona: string;
  cargo: string;
  faixaEtaria: string;
  objetivos: string;
  objecoes: string;
  canaisPreferidos: string;
}

interface ICP {
  id: string;
  segmento: string;
  porteEmpresa: string;
  faturamentoEstimado: string;
  localizacao: string;
  principaisDores: string;
}

interface OportunidadeVenda {
  id: string;
  clienteNome: string;
  valor: number;
  etapa: 'Contato' | 'Proposta' | 'Ganha' | 'Perdida';
  dataCriacao: string;
  descricao: string;
}

interface FinanceiroLancamento {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'receita' | 'despesa';
  categoria: string;
  data: string;
  status: 'pago' | 'pendente';
}

export default function Marketing() {
  const [abaAtiva, setAbaAtiva] = useState<'vendas' | 'icp_persona'>('vendas');

  // Estados de ICP
  const [icps, setIcps] = useState<ICP[]>([]);
  const [modalIcp, setModalIcp] = useState(false);
  const [icpVisualizacao, setIcpVisualizacao] = useState<ICP | null>(null);
  const [formDataIcp, setFormDataIcp] = useState<ICP>({
    id: '', segmento: '', porteEmpresa: '', faturamentoEstimado: '', localizacao: '', principaisDores: ''
  });

  // Estados de Personas
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [modalPersona, setModalPersona] = useState(false);
  const [nomePersona, setNomePersona] = useState('');
  const [cargoPersona, setCargoPersona] = useState('');
  const [faixaEtaria, setFaixaEtaria] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [objecoes, setObjecoes] = useState('');
  const [canais, setCanais] = useState('');

  // Estados do Funil de Vendas
  const [oportunidades, setOportunidades] = useState<OportunidadeVenda[]>([]);
  const [modalVenda, setModalVenda] = useState(false);
  const [opVisualizacao, setOpVisualizacao] = useState<OportunidadeVenda | null>(null);

  // Form Venda
  const [clienteNome, setClienteNome] = useState('');
  const [valorVenda, setValorVenda] = useState('');
  const [descricaoVenda, setDescricaoVenda] = useState('');
  const [etapaVenda, setEtapaVenda] = useState<'Contato' | 'Proposta' | 'Ganha' | 'Perdida'>('Contato');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    // Carregar ICPs (agora é um array/lista)
    const dadosIcp = await readCSV<ICP>('icp.csv');
    setIcps(dadosIcp);

    // Carregar Personas
    const dadosPersonas = await readCSV<Persona>('personas.csv');
    setPersonas(dadosPersonas);

    // Carregar Oportunidades
    const dadosOportunidades = await readCSV<OportunidadeVenda>('oportunidades.csv');
    setOportunidades(dadosOportunidades);
  };

  // ================= ICP LOGIC =================
  const abrirModalIcp = (icpEdit?: ICP) => {
    if (icpEdit) {
      setFormDataIcp(icpEdit);
    } else {
      setFormDataIcp({ id: '', segmento: '', porteEmpresa: '', faturamentoEstimado: '', localizacao: '', principaisDores: '' });
    }
    setModalIcp(true);
  };

  const salvarIcp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDataIcp.segmento) return;

    let novaLista = [];
    if (formDataIcp.id) {
      // Edição
      novaLista = icps.map(i => i.id === formDataIcp.id ? formDataIcp : i);
    } else {
      // Novo
      novaLista = [...icps, { ...formDataIcp, id: Date.now().toString() }];
    }

    setIcps(novaLista);
    await writeCSV('icp.csv', novaLista);
    setModalIcp(false);
  };

  const excluirIcp = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este ICP?")) return;
    const atualizadas = icps.filter(i => i.id !== id);
    setIcps(atualizadas);
    await writeCSV('icp.csv', atualizadas);
  };

  // ================= PERSONA LOGIC =================
  const salvarPersona = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomePersona) return;

    const novaPersona: Persona = {
      id: Date.now().toString(),
      nomePersona,
      cargo: cargoPersona,
      faixaEtaria,
      objetivos,
      objecoes,
      canaisPreferidos: canais
    };

    const atualizadas = [...personas, novaPersona];
    setPersonas(atualizadas);
    await writeCSV('personas.csv', atualizadas);

    setNomePersona('');
    setCargoPersona('');
    setFaixaEtaria('');
    setObjetivos('');
    setObjecoes('');
    setCanais('');
    setModalPersona(false);
  };

  const excluirPersona = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir esta Persona?")) return;
    const atualizadas = personas.filter(p => p.id !== id);
    setPersonas(atualizadas);
    await writeCSV('personas.csv', atualizadas);
  };

  // ================= VENDAS LOGIC =================
  const salvarOportunidade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteNome || !valorVenda) return;

    const valorNum = parseFloat(valorVenda.replace(',', '.')) || 0;

    const novaOportunidade: OportunidadeVenda = {
      id: Date.now().toString(),
      clienteNome,
      valor: valorNum,
      etapa: etapaVenda,
      dataCriacao: new Date().toISOString().split('T')[0],
      descricao: descricaoVenda
    };

    const listaAtualizada = [...oportunidades, novaOportunidade];
    setOportunidades(listaAtualizada);
    await writeCSV('oportunidades.csv', listaAtualizada);

    if (etapaVenda === 'Ganha') {
      await integrarComFinanceiro(clienteNome, valorNum, descricaoVenda);
    }

    setClienteNome('');
    setValorVenda('');
    setDescricaoVenda('');
    setEtapaVenda('Contato');
    setModalVenda(false);
  };

  const alterarEtapaVenda = async (id: string, novaEtapa: 'Contato' | 'Proposta' | 'Ganha' | 'Perdida') => {
    const listaAtualizada = oportunidades.map(op => {
      if (op.id === id) {
        return { ...op, etapa: novaEtapa };
      }
      return op;
    });

    setOportunidades(listaAtualizada);
    await writeCSV('oportunidades.csv', listaAtualizada);

    const opModificada = oportunidades.find(o => o.id === id);
    if (novaEtapa === 'Ganha' && opModificada) {
      await integrarComFinanceiro(opModificada.clienteNome, opModificada.valor, opModificada.descricao);
    }
  };

  const integrarComFinanceiro = async (cliente: string, valor: number, desc: string) => {
    const finExistente = await readCSV<FinanceiroLancamento>('financeiro.csv');

    const novoLancamento: FinanceiroLancamento = {
      id: Date.now().toString(),
      descricao: `Venda Fechada: ${cliente} ${desc ? `(${desc})` : ''}`,
      valor: valor,
      tipo: 'receita',
      categoria: 'Vendas',
      data: new Date().toISOString().split('T')[0],
      status: 'pago'
    };

    const finAtualizado = [...finExistente, novoLancamento];
    await writeCSV('financeiro.csv', finAtualizado);
    alert(`🎉 Venda Ganha! Foi gerado um lançamento automático de R$ ${valor.toFixed(2)} no módulo Financeiro.`);
  };

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 overflow-hidden">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Target className="text-blue-600" size={28} /> Marketing e Vendas
          </h1>
          <p className="text-slate-500 mt-1">Gerencie seu funil de clientes e conecte suas vendas diretamente ao Financeiro</p>
        </div>

        {/* Seleção de Abas */}
        <div className="flex bg-slate-200 p-1 rounded-xl gap-1">
          <button
            onClick={() => setAbaAtiva('vendas')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              abaAtiva === 'vendas' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp size={16} /> Funil de Vendas
          </button>
          <button
            onClick={() => setAbaAtiva('icp_persona')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              abaAtiva === 'icp_persona' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={16} /> ICP & Personas
          </button>
        </div>
      </div>

      {/* ABA 1: FUNIL DE VENDAS */}
      {abaAtiva === 'vendas' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Oportunidades em Negociação
            </h3>
            <button
              onClick={() => setModalVenda(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
            >
              <Plus size={16} /> Nova Oportunidade
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 min-h-0 overflow-y-auto">
            
            {/* Coluna Contato */}
            <div className="bg-slate-100/80 rounded-xl p-3 border border-slate-200 flex flex-col">
              <div className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                <span>1. Em Contato</span>
                <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                  {oportunidades.filter(o => o.etapa === 'Contato').length}
                </span>
              </div>
              <div className="space-y-3 overflow-y-auto flex-1">
                {oportunidades
                  .filter(o => o.etapa === 'Contato')
                  .sort((a, b) => Number(a.id) - Number(b.id))
                  .map(op => (
                  <div key={op.id} className="bg-white p-3.5 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-slate-800">{op.clienteNome}</p>
                      <button 
                        onClick={() => setOpVisualizacao(op)} 
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                        title="Visualizar Card"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                    <p className="text-blue-600 font-extrabold text-sm">R$ {op.valor.toFixed(2)}</p>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end gap-1">
                      <button 
                        onClick={() => alterarEtapaVenda(op.id, 'Proposta')} 
                        className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1 font-medium w-full justify-center border border-blue-100"
                      >
                        Proposta <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna Proposta */}
            <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 flex flex-col">
              <div className="font-bold text-xs uppercase tracking-wider text-blue-700 mb-3 flex items-center justify-between">
                <span>2. Proposta Enviada</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {oportunidades.filter(o => o.etapa === 'Proposta').length}
                </span>
              </div>
              <div className="space-y-3 overflow-y-auto flex-1">
                {oportunidades
                  .filter(o => o.etapa === 'Proposta')
                  .sort((a, b) => Number(a.id) - Number(b.id))
                  .map(op => (
                  <div key={op.id} className="bg-white p-3.5 rounded-lg shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-slate-800">{op.clienteNome}</p>
                      <button 
                        onClick={() => setOpVisualizacao(op)} 
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                        title="Visualizar Card"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                    <p className="text-blue-600 font-extrabold text-sm">R$ {op.valor.toFixed(2)}</p>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between gap-2">
                      <button 
                        onClick={() => alterarEtapaVenda(op.id, 'Perdida')} 
                        className="text-xs text-rose-600 hover:bg-rose-50 px-2 py-1 rounded flex-1 border border-rose-100 text-center"
                      >
                        Perdida
                      </button>
                      <button 
                        onClick={() => alterarEtapaVenda(op.id, 'Ganha')} 
                        className="text-xs text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded flex items-center justify-center gap-1 flex-1 border border-emerald-200"
                      >
                        <CheckCircle2 size={13} /> Ganhar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna Ganha */}
            <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 flex flex-col">
              <div className="font-bold text-xs uppercase tracking-wider text-emerald-800 mb-3 flex items-center justify-between">
                <span>3. Ganha (Financeiro)</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {oportunidades.filter(o => o.etapa === 'Ganha').length}
                </span>
              </div>
              <div className="space-y-3 overflow-y-auto flex-1">
                {oportunidades
                  .filter(o => o.etapa === 'Ganha')
                  .sort((a, b) => Number(a.id) - Number(b.id))
                  .map(op => (
                  <div key={op.id} className="bg-white p-3.5 rounded-lg shadow-sm border border-emerald-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-slate-800">{op.clienteNome}</p>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block">No Financeiro</span>
                      </div>
                      <button 
                        onClick={() => setOpVisualizacao(op)} 
                        className="text-slate-400 hover:text-emerald-600 transition-colors"
                        title="Visualizar Card"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                    <p className="text-emerald-700 font-extrabold mt-2 text-sm">R$ {op.valor.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna Perdida */}
            <div className="bg-rose-50/30 rounded-xl p-3 border border-rose-100 flex flex-col">
              <div className="font-bold text-xs uppercase tracking-wider text-rose-700 mb-3 flex items-center justify-between">
                <span>4. Perdida</span>
                <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                  {oportunidades.filter(o => o.etapa === 'Perdida').length}
                </span>
              </div>
              <div className="space-y-3 overflow-y-auto flex-1">
                {oportunidades
                  .filter(o => o.etapa === 'Perdida')
                  .sort((a, b) => Number(a.id) - Number(b.id))
                  .map(op => (
                  <div key={op.id} className="bg-white p-3.5 rounded-lg shadow-sm border border-slate-200 opacity-70 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-slate-800 line-through decoration-slate-400">{op.clienteNome}</p>
                      <button 
                        onClick={() => setOpVisualizacao(op)} 
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Visualizar Card"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                    <p className="text-slate-600 font-bold text-sm">R$ {op.valor.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ABA 2: DEFINIÇÃO DE ICP E PERSONAS */}
      {abaAtiva === 'icp_persona' && (
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          
          {/* Seção ICP (Agora em Cards) */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="text-blue-600" size={24} /> Perfil de Cliente Ideal (ICP)
                </h3>
                <p className="text-sm text-slate-500 mt-1">Defina os perfis das empresas ou nichos que você quer focar</p>
              </div>
              <button
                onClick={() => abrirModalIcp()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
              >
                <Plus size={16} /> Criar ICP
              </button>
            </div>

            {icps.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-300">
                Nenhum ICP cadastrado. Clique em <b>"Criar ICP"</b> para definir seu cliente ideal.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {icps.map(icp => (
                  <div key={icp.id} className="border border-slate-200 p-5 rounded-xl bg-slate-50/50 relative group hover:shadow-md transition-shadow">
                    
                    {/* Botões de Ação do Card */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={() => setIcpVisualizacao(icp)}
                        className="text-slate-400 hover:text-blue-600 p-1 transition-colors"
                        title="Visualizar ICP"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => abrirModalIcp(icp)}
                        className="text-slate-400 hover:text-emerald-600 p-1 transition-colors"
                        title="Editar ICP"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => excluirIcp(icp.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Excluir ICP"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <h4 className="font-bold text-slate-800 text-lg uppercase pr-24">{icp.segmento}</h4>
                    <p className="text-sm font-semibold text-blue-600 mb-4">{icp.porteEmpresa} • {icp.localizacao}</p>

                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-bold text-slate-700 block">Faturamento:</span>
                        <p className="text-slate-600 leading-relaxed">{icp.faturamentoEstimado || '-'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block">Principais Dores:</span>
                        <p className="text-slate-600 leading-relaxed line-clamp-2">{icp.principaisDores || '-'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção Personas */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Users className="text-blue-600" size={24} /> Personas Mapeadas
                </h3>
                <p className="text-sm text-slate-500 mt-1">Defina o perfil do comprador e tomador de decisão</p>
              </div>
              <button
                onClick={() => setModalPersona(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
              >
                <Plus size={16} /> Criar Persona
              </button>
            </div>

            {personas.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-300">
                Nenhuma persona cadastrada. Clique em <b>"Criar Persona"</b> para mapear o perfil do seu cliente final.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personas.map(p => (
                  <div key={p.id} className="border border-slate-200 p-5 rounded-xl bg-slate-50/50 relative group hover:shadow-md transition-shadow">
                    <button 
                      onClick={() => excluirPersona(p.id)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Excluir Persona"
                    >
                      <Trash2 size={18} />
                    </button>

                    <h4 className="font-bold text-slate-800 text-lg uppercase pr-10">{p.nomePersona}</h4>
                    <p className="text-sm font-semibold text-blue-600 mb-4">{p.cargo} • {p.faixaEtaria}</p>

                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-bold text-slate-700 block">Objetivos / Desejos:</span>
                        <p className="text-slate-600 leading-relaxed uppercase">{p.objetivos || '-'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block">Objeções Frequentes:</span>
                        <p className="text-slate-600 leading-relaxed uppercase">{p.objecoes || '-'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block">Canais Ocupados:</span>
                        <p className="text-slate-600 leading-relaxed uppercase">{p.canaisPreferidos || '-'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* MODAIS ICP */}
      {/* Modal Criar/Editar ICP */}
      {modalIcp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 border border-slate-200 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Building2 className="text-blue-600" size={24} /> 
              {formDataIcp.id ? 'Editar ICP' : 'Criar Novo ICP'}
            </h3>
            
            <form onSubmit={salvarIcp} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Segmento / Nicho *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Lojas de Varejo" 
                  value={formDataIcp.segmento} 
                  onChange={e => setFormDataIcp({ ...formDataIcp, segmento: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Porte do Cliente</label>
                <input 
                  type="text" 
                  placeholder="Ex: Pequenas Empresas" 
                  value={formDataIcp.porteEmpresa} 
                  onChange={e => setFormDataIcp({ ...formDataIcp, porteEmpresa: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Faturamento Estimado</label>
                <input 
                  type="text" 
                  placeholder="Ex: R$ 50 mil a R$ 200 mil" 
                  value={formDataIcp.faturamentoEstimado} 
                  onChange={e => setFormDataIcp({ ...formDataIcp, faturamentoEstimado: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Localização Principal</label>
                <input 
                  type="text" 
                  placeholder="Ex: Região Sul, Remoto" 
                  value={formDataIcp.localizacao} 
                  onChange={e => setFormDataIcp({ ...formDataIcp, localizacao: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-blue-500 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="md:col-span-2 mt-2">
                <label className="block text-base font-bold text-slate-800 mb-2">Principais Dores e Problemas</label>
                <textarea 
                  rows={4}
                  placeholder="Descreva as maiores dores do seu cliente..."
                  value={formDataIcp.principaisDores} 
                  onChange={e => setFormDataIcp({ ...formDataIcp, principaisDores: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-4 text-sm text-slate-700 outline-none focus:border-blue-500 bg-slate-50 focus:bg-white shadow-inner resize-y"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setModalIcp(false)} className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm">
                  Salvar ICP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualizar ICP */}
      {icpVisualizacao && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-slate-200 shadow-2xl relative">
            <button 
              onClick={() => setIcpVisualizacao(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold text-slate-800 mb-1 pr-8 uppercase">{icpVisualizacao.segmento}</h3>
            <p className="text-sm font-semibold text-blue-600 mb-6 uppercase">{icpVisualizacao.porteEmpresa} • {icpVisualizacao.localizacao}</p>
            
            <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
              <div>
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Faturamento Estimado</span>
                <p className="text-slate-800 font-semibold">{icpVisualizacao.faturamentoEstimado || 'Não informado'}</p>
              </div>
              
              <div className="pt-2 border-t border-slate-200">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Principais Dores e Problemas</span>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {icpVisualizacao.principaisDores || 'Nenhuma dor especificada.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button 
                onClick={() => setIcpVisualizacao(null)} 
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VENDAS - VISUALIZAÇÃO */}
      {opVisualizacao && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl relative">
            <button 
              onClick={() => setOpVisualizacao(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-1">{opVisualizacao.clienteNome}</h3>
            <p className="text-sm text-slate-500 font-medium mb-6">Cadastrado em: {opVisualizacao.dataCriacao.split('-').reverse().join('/')}</p>
            
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Valor Estimado</span>
                <p className="text-2xl font-black text-blue-600">R$ {opVisualizacao.valor.toFixed(2)}</p>
              </div>
              
              <div>
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Etapa Atual</span>
                <span className="inline-block bg-white border border-slate-200 font-semibold text-slate-700 px-3 py-1 rounded-lg text-sm">
                  {opVisualizacao.etapa}
                </span>
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Descrição / Observação</span>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {opVisualizacao.descricao || 'Sem descrição informada.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button 
                onClick={() => setOpVisualizacao(null)} 
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VENDAS - NOVA */}
      {modalVenda && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Nova Oportunidade de Venda</h3>
            <form onSubmit={salvarOportunidade} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Cliente / Empresa *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Mercado Silva" 
                  value={clienteNome} 
                  onChange={e => setClienteNome(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Valor Estimado (R$) *</label>
                <input 
                  type="text" 
                  required
                  placeholder="0.00" 
                  value={valorVenda} 
                  onChange={e => setValorVenda(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Etapa Inicial</label>
                <select 
                  value={etapaVenda} 
                  onChange={e => setEtapaVenda(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="Contato">Em Contato</option>
                  <option value="Proposta">Proposta Enviada</option>
                  <option value="Ganha">Ganha (Lança no Financeiro)</option>
                  <option value="Perdida">Perdida</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição / Observação</label>
                <textarea 
                  rows={2}
                  placeholder="Ex: Interesse no plano anual de gestão" 
                  value={descricaoVenda} 
                  onChange={e => setDescricaoVenda(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setModalVenda(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PERSONA - NOVA */}
      {modalPersona && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-slate-200 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Cadastrar Nova Persona</h3>
            <form onSubmit={salvarPersona} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Fictício *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ex: Carlos Gerente" 
                    value={nomePersona} 
                    onChange={e => setNomePersona(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo / Função</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Diretor de Operações" 
                    value={cargoPersona} 
                    onChange={e => setCargoPersona(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Faixa Etária</label>
                <input 
                  type="text" 
                  placeholder="Ex: 35 a 50 anos" 
                  value={faixaEtaria} 
                  onChange={e => setFaixaEtaria(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Objetivos</label>
                <input 
                  type="text" 
                  placeholder="Ex: Reduzir tempo com relatórios manuais" 
                  value={objetivos} 
                  onChange={e => setObjetivos(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Objeções Principais</label>
                <input 
                  type="text" 
                  placeholder="Ex: Acha difícil de usar" 
                  value={objecoes} 
                  onChange={e => setObjecoes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Canais Preferidos</label>
                <input 
                  type="text" 
                  placeholder="Ex: WhatsApp, E-mail" 
                  value={canais} 
                  onChange={e => setCanais(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setModalPersona(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Salvar Persona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}