import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit2, Download, Search, X } from 'lucide-react';
import { readCSV, writeCSV } from '../core/csvService';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cnpjCpf: string;
  cnae: string;
  cep: string;
  rua: string;
  cidade: string;
  estado: string;
  observacao: string;
  colaborador: string;
  nicho: string;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  
  // Estado do Formulário
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [cnae, setCnae] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [observacao, setObservacao] = useState('');
  const [colaborador, setColaborador] = useState('');
  const [nicho, setNicho] = useState('');

  // Menu de Contexto (Botão Direito)
  const [menuContexto, setMenuContexto] = useState<{ id: string; x: number; y: number } | null>(null);

  useEffect(() => {
    carregarClientes();
    const fecharMenu = () => setMenuContexto(null);
    window.addEventListener('click', fecharMenu);
    return () => window.removeEventListener('click', fecharMenu);
  }, []);

  const carregarClientes = async () => {
    const dados = await readCSV<Cliente>('clientes.csv');
    setClientes(dados || []);
  };

  const salvarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;

    let atualizados: Cliente[];
    if (editandoId) {
      atualizados = clientes.map(c => c.id === editandoId ? {
        id: editandoId, nome, email, telefone, cnpjCpf, cnae, cep, rua, cidade, estado, observacao, colaborador, nicho
      } : c);
    } else {
      const novo: Cliente = {
        id: Date.now().toString(),
        nome, email, telefone, cnpjCpf, cnae, cep, rua, cidade, estado, observacao, colaborador, nicho
      };
      atualizados = [...clientes, novo];
    }

    setClientes(atualizados);
    await writeCSV('clientes.csv', atualizados);
    fecharModal();
  };

  const abrirModalNovo = () => {
    limparFormulario();
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    limparFormulario();
  };

  const limparFormulario = () => {
    setEditandoId(null);
    setNome('');
    setEmail('');
    setTelefone('');
    setCnpjCpf('');
    setCnae('');
    setCep('');
    setRua('');
    setCidade('');
    setEstado('');
    setObservacao('');
    setColaborador('');
    setNicho('');
  };

  const iniciarEdicao = (cliente: Cliente) => {
    setEditandoId(cliente.id);
    setNome(cliente.nome || '');
    setEmail(cliente.email || '');
    setTelefone(cliente.telefone || '');
    setCnpjCpf(cliente.cnpjCpf || '');
    setCnae(cliente.cnae || '');
    setCep(cliente.cep || '');
    setRua(cliente.rua || '');
    setCidade(cliente.cidade || '');
    setEstado(cliente.estado || '');
    setObservacao(cliente.observacao || '');
    setColaborador(cliente.colaborador || '');
    setNicho(cliente.nicho || '');
    setModalAberto(true);
    setMenuContexto(null);
  };

  const excluirCliente = async (id: string) => {
    const atualizados = clientes.filter(c => c.id !== id);
    setClientes(atualizados);
    await writeCSV('clientes.csv', atualizados);
    setMenuContexto(null);
  };

  const exportarVCard = (cliente: Cliente) => {
    try {
      const notasAdicionais = [
        cliente.colaborador ? `Colaborador: ${cliente.colaborador}` : '',
        cliente.nicho ? `Nicho: ${cliente.nicho}` : '',
        cliente.observacao || ''
      ].filter(Boolean).join('\\n');

      const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${cliente.nome || ''}`,
        `TEL:${cliente.telefone || ''}`,
        `EMAIL:${cliente.email || ''}`,
        `ADR:;;${cliente.rua || ''};${cliente.cidade || ''};${cliente.estado || ''};${cliente.cep || ''};`,
        `NOTE:${notasAdicionais}`,
        'END:VCARD'
      ].join('\n');

      const nomeArquivo = `${(cliente.nome || 'cliente').replace(/\s+/g, '_')}.vcf`;
      const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Erro ao exportar vCard:", error);
      alert("Ocorreu um erro ao tentar criar o arquivo.");
    }
    setMenuContexto(null);
  };

  const abrirMenuDireito = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMenuContexto({ id, x: e.clientX, y: e.clientY });
  };

  // Pesquisa robusta convertendo todos os campos explicitamente para String
  const clientesFiltrados = clientes.filter(c => {
    const termo = busca.toLowerCase();
    return (
      String(c.nome || '').toLowerCase().includes(termo) ||
      String(c.cnpjCpf || '').toLowerCase().includes(termo) ||
      String(c.cidade || '').toLowerCase().includes(termo) ||
      String(c.nicho || '').toLowerCase().includes(termo) ||
      String(c.colaborador || '').toLowerCase().includes(termo)
    );
  });

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden bg-slate-50 relative">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestão de Clientes</h1>
          <p className="text-slate-500 mt-1">Cadastre e gerencie sua base de clientes e parceiros</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome, CPF, cidade, nicho..." 
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white shadow-sm outline-none focus:border-blue-500"
            />
          </div>
          <button 
            onClick={abrirModalNovo}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm transition-colors shrink-0"
          >
            <Plus size={16} /> Novo Cliente
          </button>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-y-auto p-4 flex-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Lista de Clientes Cadastrados (Clique com o botão direito para gerenciar)</h3>
        
        {clientesFiltrados.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">Nenhum cliente encontrado.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {clientesFiltrados.map((cliente, index) => (
              <div 
                key={cliente.id || index} 
                onContextMenu={(e) => abrirMenuDireito(e, cliente.id)}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 bg-white shadow-xs transition-all cursor-pointer flex justify-between items-start"
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm">{cliente.nome}</h4>
                  <div className="flex gap-3 text-xs text-slate-500 flex-wrap">
                    {cliente.cnpjCpf && <span><strong>CPF/CNPJ:</strong> {cliente.cnpjCpf}</span>}
                    {cliente.telefone && <span><strong>Tel:</strong> {cliente.telefone}</span>}
                    {cliente.cidade && <span><strong>Cidade:</strong> {cliente.cidade}/{cliente.estado}</span>}
                    {cliente.cnae && <span><strong>CNAE:</strong> {cliente.cnae}</span>}
                    {cliente.nicho && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded"><strong>Nicho:</strong> {cliente.nicho}</span>}
                    {cliente.colaborador && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded"><strong>Colab:</strong> {cliente.colaborador}</span>}
                  </div>
                  {cliente.observacao && <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded mt-1 border border-slate-100 line-clamp-2"><strong>Obs:</strong> {cliente.observacao}</p>}
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded font-medium shrink-0">Botão direito</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Cadastro / Edição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users size={20} className="text-blue-600" /> 
                {editandoId ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={fecharModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={salvarCliente} className="p-5 space-y-3 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nome Completo / Razão Social *</label>
                <input type="text" required placeholder="Ex: Empresa X Ltda" value={nome} onChange={e => setNome(e.target.value)} className="w-full border border-slate-300 outline-none focus:border-blue-500 rounded-lg p-2 text-sm" />
              </div>
              
              {/* Campos: Colaborador e Nicho */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nome Colaborador</label>
                  <input type="text" placeholder="Responsável pelo cliente" value={colaborador} onChange={e => setColaborador(e.target.value)} className="w-full border border-slate-300 outline-none focus:border-blue-500 rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nicho</label>
                  <input type="text" placeholder="Ex: Tecnologia, Moda, Saúde" value={nicho} onChange={e => setNicho(e.target.value)} className="w-full border border-slate-300 outline-none focus:border-blue-500 rounded-lg p-2 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">CPF / CNPJ</label>
                  <input type="text" placeholder="000.000.000-00" value={cnpjCpf} onChange={e => setCnpjCpf(e.target.value)} className="w-full border border-slate-300 outline-none focus:border-blue-500 rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">CNAE</label>
                  <input type="text" placeholder="Código CNAE" value={cnae} onChange={e => setCnae(e.target.value)} className="w-full border border-slate-300 outline-none focus:border-blue-500 rounded-lg p-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">E-mail</label>
                  <input type="email" placeholder="contato@email.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-slate-300 outline-none focus:border-blue-500 rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Telefone / WhatsApp</label>
                  <input type="text" placeholder="(00) 00000-0000" value={telefone} onChange={e => setTelefone(e.target.value)} className="w-full border border-slate-300 outline-none focus:border-blue-500 rounded-lg p-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">CEP</label>
                  <input type="text" placeholder="00000-000" value={cep} onChange={e => setCep(e.target.value)} className="w-full border border-slate-300 outline-none focus:border-blue-500 rounded-lg p-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Rua / Logradouro</label>
                  <input type="text" placeholder="Av. Principal, 100" value={rua} onChange={e => setRua(e.target.value)} className="w-full border border-slate-300 outline-none focus:border-blue-500 rounded-lg p-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cidade</label>
                  <input type="text" placeholder="Nome da Cidade" value={cidade} onChange={e => setCidade(e.target.value)} className="w-full border border-slate-300 outline-none focus:border-blue-500 rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Estado</label>
                  <input type="text" placeholder="UF" value={estado} onChange={e => setEstado(e.target.value)} className="w-full border border-slate-300 outline-none focus:border-blue-500 rounded-lg p-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Observações Gerais</label>
                <textarea rows={4} placeholder="Digite observações importantes sobre o cliente aqui..." value={observacao} onChange={e => setObservacao(e.target.value)} className="w-full border border-slate-300 outline-none focus:border-blue-500 rounded-lg p-2 text-sm resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={fecharModal} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2.5 rounded-lg font-medium text-sm">
                  Cancelar
                </button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-colors">
                  {editandoId ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu de Contexto (Botão Direito) */}
      {menuContexto && (
        <div 
          style={{ top: menuContexto.y, left: menuContexto.x }} 
          className="fixed z-50 bg-white shadow-xl border border-slate-200 rounded-lg py-1 w-48 text-sm"
        >
          <button 
            onClick={() => { const c = clientes.find(x => x.id === menuContexto.id); if (c) iniciarEdicao(c); }}
            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-slate-700 flex items-center gap-2"
          >
            <Edit2 size={14} className="text-blue-600" /> Editar
          </button>
          <button 
            onClick={() => { const c = clientes.find(x => x.id === menuContexto.id); if (c) exportarVCard(c); }}
            className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-slate-700 flex items-center gap-2"
          >
            <Download size={14} className="text-emerald-600" /> Exportar vCard (.vcf)
          </button>
          <button 
            onClick={() => excluirCliente(menuContexto.id)}
            className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 border-t border-slate-100"
          >
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}