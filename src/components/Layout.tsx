import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Regra do PDF: Botão de retorno ("voltar") no topo para navegação fluida
  const showBackButton = location.pathname !== '/';

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Barra superior (Header) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shadow-sm shrink-0">
          {showBackButton && (
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mr-4"
            >
              <ArrowLeft size={20} />
              <span className="font-medium text-sm">Voltar</span>
            </button>
          )}
          <div className="flex-1"></div>
          <div className="text-sm text-slate-500 font-medium">
            Ambiente Local Seguro
          </div>
        </header>

        {/* Área onde as páginas são renderizadas */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}