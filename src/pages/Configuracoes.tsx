import CardBackupNuvem from '../components/CardBackupNuvem';
import CardAtualizacao from '../components/CardAtualizacao';

export default function Configuracoes() {
  return (
    <div className="p-6 h-full flex flex-col bg-slate-50">
      
      {/* Cabeçalho da Tela */}
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-slate-800">Configurações do Sistema</h1>
        <p className="text-slate-500 mt-1">Gerencie seus dados, backups e atualizações.</p>
      </div>

      {/* Grid que coloca os cards lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardBackupNuvem />
        <CardAtualizacao />
      </div>

    </div>
  );
}