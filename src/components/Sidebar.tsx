import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Package, FileText, 
  Target, DollarSign, Settings, 
  ChevronLeft, ChevronRight 
} from 'lucide-react';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const renderLink = (path: string, icon: any, label: string) => (
    <NavLink
      key={path}
      to={path}
      className={({ isActive }) =>
        `flex items-center rounded-lg transition-colors ${
          isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3 gap-4'
        } ${
          isActive 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`
      }
      title={isCollapsed ? label : ''}
    >
      <div className="flex-shrink-0">{icon}</div>
      {/* Esta é a linha que o Gemini havia apagado e que faz os nomes aparecerem: */}
      {!isCollapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
    </NavLink>
  );

  return (
    <aside className={`bg-[#1e293b] text-slate-300 flex flex-col transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-20' : 'w-72'}`}>
      
      <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-700/50 shrink-0">
        <h2 className={`font-bold text-white transition-all duration-300 ${isCollapsed ? 'scale-0 hidden' : 'scale-100 text-xl'}`}>
          Gestão Desktop
        </h2>
        {!isCollapsed && <span className="text-xs text-slate-400">SaaS Local</span>}
        {isCollapsed && <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mx-auto">G</div>}
      </div>

      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 bg-blue-600 text-white rounded-full p-1 shadow-lg hover:bg-blue-500 transition-colors z-10"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <nav className="flex-1 py-6 px-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
        
        {!isCollapsed && <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4 mt-2">Principal</div>}
        <div className="space-y-1">
          {renderLink('/', <LayoutDashboard size={20} />, 'Dashboard')}
          {renderLink('/clientes', <Users size={20} />, 'Clientes')}
          {renderLink('/produtos', <Package size={20} />, 'Produtos & Estoque')}
          {renderLink('/orcamentos', <FileText size={20} />, 'Orçamentos')}
        </div>

        {!isCollapsed && <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4 mt-8">Comercial</div>}
        <div className="space-y-1">
          {renderLink('/marketing', <Target size={20} />, 'Marketing & Vendas')}
          {renderLink('/financeiro', <DollarSign size={20} />, 'Financeiro & Calendário')}
        </div>

        {/* A seção Suíte Office foi completamente removida daqui! */}
      </nav>

      <div className="p-3 border-t border-slate-700/50 shrink-0">
        {renderLink('/configuracoes', <Settings size={20} />, 'Configurações')}
      </div>
    </aside>
  );
}