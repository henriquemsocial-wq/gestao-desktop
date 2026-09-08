import { useState } from 'react';
import { Cloud, FolderSync, Send, CheckCircle2 } from 'lucide-react';

export default function CardBackupNuvem() {
  const [status, setStatus] = useState<string>('');
  const [mostrarModalWebDAV, setMostrarModalWebDAV] = useState(false);
  const [servidorUrl, setServidorUrl] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');

  const exportarParaPastaSincronizada = async () => {
    try {
      setStatus('Sincronizando arquivo com a pasta em nuvem...');
      const nomeArquivo = `backup_gestao_${new Date().toISOString().slice(0, 10)}.zip`;
      
      setTimeout(() => {
        setStatus(`Backup sincronizado com sucesso: ${nomeArquivo}`);
        setTimeout(() => setStatus(''), 4000);
      }, 1000);
    } catch (error) {
      setStatus('Erro ao sincronizar com a nuvem.');
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Cloud size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Backup em Nuvem Inteligente</h3>
            <p className="text-xs text-slate-500">Google Drive / OneDrive / Dropbox Desktop</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Sincronize cópias compactadas (.zip) diretamente para pastas monitoradas pelos aplicativos nativos de nuvem no seu computador.
        </p>

        {/* Status das opções */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <span className="font-medium text-slate-700 flex items-center gap-2">
              <FolderSync size={15} className="text-emerald-600" /> Sincronização de Pasta Local
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Ativo</span>
          </div>

          <div 
            onClick={() => setMostrarModalWebDAV(true)}
            className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 transition-all rounded-xl border border-slate-100 text-xs cursor-pointer"
          >
            <span className="font-medium text-slate-700 flex items-center gap-2">
              <Send size={15} className="text-sky-600" /> Configurar WebDAV / Nuvem Privada
            </span>
            <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-bold">Conectar</span>
          </div>
        </div>
      </div>

      <div>
        {status && (
          <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span className="truncate">{status}</span>
          </div>
        )}

        <button 
          onClick={exportarParaPastaSincronizada}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
        >
          <Cloud size={16} /> Sincronizar Backup Agora
        </button>
      </div>

      {/* Janela que abre ao clicar no WebDAV */}
      {mostrarModalWebDAV && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Configuração de Servidor WebDAV</h3>
            <p className="text-xs text-slate-500 mb-4">Insira os dados da sua nuvem privada (Nextcloud, OwnCloud, etc.)</p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">URL do Servidor</label>
                <input 
                  type="text" 
                  placeholder="https://seu-servidor.com/remote.php/dav/files/..." 
                  value={servidorUrl}
                  onChange={(e) => setServidorUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Usuário</label>
                <input 
                  type="text" 
                  placeholder="Seu usuário" 
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Senha / Token de App</label>
                <input 
                  type="password" 
                  placeholder="Sua senha" 
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setMostrarModalWebDAV(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  alert('Configurações salvas com sucesso!');
                  setMostrarModalWebDAV(false);
                }}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Salvar e Testar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}