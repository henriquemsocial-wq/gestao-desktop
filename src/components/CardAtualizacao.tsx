import { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Loader2, GitBranch } from 'lucide-react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export default function CardAtualizacao() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info' | null, message: string }>({ type: null, message: '' });

  const verificarAtualizacao = async () => {
    setIsUpdating(true);
    setStatus({ type: 'info', message: 'Procurando atualizações no GitHub...' });

    try {
      // Busca atualizações usando o plugin oficial do Tauri
      const update = await check();

      if (update?.available) {
        setStatus({ type: 'info', message: `Nova versão (${update.version}) encontrada. Instalando...` });
        
        // Baixa e instala a atualização
        await update.downloadAndInstall((event) => {
          if (event.event === 'Started') {
            setStatus({ type: 'info', message: 'Baixando atualização...' });
          } else if (event.event === 'Finished') {
            setStatus({ type: 'success', message: 'Instalação concluída! Reiniciando...' });
          }
        });

        // Reinicia o sistema após atualizar
        await relaunch();
      } else {
        setStatus({ type: 'success', message: 'O sistema já está na versão mais recente!' });
      }
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Erro ao buscar atualização. Verifique sua conexão.' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <RefreshCw size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Atualização de Software</h3>
            <p className="text-xs text-slate-500">Via GitHub Releases</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Mantenha seu sistema sempre na última versão. O download e a instalação são feitos de forma automática e segura.
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <span className="font-medium text-slate-700 flex items-center gap-2">
              <GitBranch size={15} className="text-slate-600" /> Repositório Conectado
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Ativo</span>
          </div>
        </div>
      </div>

      <div>
        {status.type && (
          <div className={`mb-3 p-2 text-xs rounded-lg flex items-center gap-2 border ${
            status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
            status.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' :
            'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            {status.type === 'success' && <CheckCircle2 size={16} className="shrink-0" />}
            {status.type === 'error' && <AlertCircle size={16} className="shrink-0" />}
            {status.type === 'info' && <Loader2 size={16} className="shrink-0 animate-spin" />}
            <span className="truncate">{status.message}</span>
          </div>
        )}

        <button 
          onClick={verificarAtualizacao}
          disabled={isUpdating}
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
        >
          {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {isUpdating ? 'Atualizando...' : 'Verificar Atualizações'}
        </button>
      </div>
    </div>
  );
}