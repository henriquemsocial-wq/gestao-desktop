import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { initializeFileSystem } from './core/csvService';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Produtos from './pages/Produtos';
import Orcamentos from './pages/Orcamentos';
import Configuracoes from './pages/Configuracoes';

import MarketingVendas from './pages/MarketingVendas';
import Financeiro from './pages/Financeiro';

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeFileSystem().then(() => {
      setIsReady(true);
    });
  }, []);

  if (!isReady) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="text-lg font-semibold text-slate-600 animate-pulse">
          Carregando banco de dados local...
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Rotas Principais */}
          <Route index element={<Dashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="produtos" element={<Produtos />} />
          <Route path="orcamentos" element={<Orcamentos />} />
          
          {/* Rotas Comerciais */}
          <Route path="marketing" element={<MarketingVendas />} />
          <Route path="financeiro" element={<Financeiro />} />
          
          {/* Configurações */}
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;