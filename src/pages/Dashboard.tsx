import { useEffect, useState } from 'react';
import { readCSV } from '../core/csvService';

interface VendaMes {
  mes: string;
  valor: number;
}

interface EtapaFunil {
  etapa: string;
  quantidade: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [totalVendas, setTotalVendas] = useState(0);
  const [totalDespesas, setTotalDespesas] = useState(0);
  const [totalContatos, setTotalContatos] = useState(0);
  const [totalPendencias, setTotalPendencias] = useState(0);
  const [vendasPorMes, setVendasPorMes] = useState<VendaMes[]>([]);
  const [funilEtapas, setFunilEtapas] = useState<EtapaFunil[]>([]);

  useEffect(() => {
    async function carregarDadosDashboard() {
      try {
        setLoading(true);

        const [financeiro, clientes, orcamentos] = await Promise.all([
          readCSV<any>('financeiro.csv'),
          readCSV<any>('clientes.csv'),
          readCSV<any>('orcamentos.csv'),
        ]);

        let somaVendas = 0;
        let somaDespesas = 0;
        const mapaMeses: { [key: string]: number } = {};

        financeiro.forEach((item) => {
          const valorNum = parseFloat(String(item.valor || 0).replace(',', '.'));
          const tipo = String(item.tipo || '').toLowerCase();
          const dataStr = item.data_vencimento || item.data || '';

          if (tipo === 'receita' || tipo === 'venda' || valorNum > 0) {
            const valorAbs = Math.abs(valorNum);
            somaVendas += valorAbs;

            let mesAno = 'Geral';
            if (dataStr) {
              const partes = dataStr.split('-');
              if (partes.length >= 2) {
                mesAno = `${partes[1]}/${partes[0]}`;
              } else if (dataStr.includes('/')) {
                const partesBarra = dataStr.split('/');
                if (partesBarra.length >= 2) {
                  mesAno = `${partesBarra[1]}/${partesBarra[2] || partesBarra[0]}`;
                }
              }
            }
            mapaMeses[mesAno] = (mapaMeses[mesAno] || 0) + valorAbs;

          } else if (tipo === 'despesa' || valorNum < 0) {
            somaDespesas += Math.abs(valorNum);
          }
        });

        const totalClientes = clientes.length;

        let pendenciasCount = 0;
        orcamentos.forEach((orc) => {
          const status = String(orc.status || '').toLowerCase();
          if (status === 'pendente' || status === 'em aberto' || !status) {
            pendenciasCount += 1;
          }
        });

        financeiro.forEach((fin) => {
          const status = String(fin.status || '').toLowerCase();
          if (status === 'pendente') {
            pendenciasCount += 1;
          }
        });

        const mapaFunil: { [key: string]: number } = {
          'Pendente': 0,
          'Aprovado': 0,
          'Cancelado': 0,
        };

        orcamentos.forEach((orc) => {
          const st = orc.status ? String(orc.status) : 'Pendente';
          if (mapaFunil[st] !== undefined) {
            mapaFunil[st] += 1;
          } else {
            mapaFunil[st] = (mapaFunil[st] || 0) + 1;
          }
        });

        const listaVendasMes = Object.keys(mapaMeses).map((mes) => ({
          mes,
          valor: mapaMeses[mes],
        }));

        const listaFunil = Object.keys(mapaFunil).map((etapa) => ({
          etapa,
          quantidade: mapaFunil[etapa],
        }));

        setTotalVendas(somaVendas);
        setTotalDespesas(somaDespesas);
        setTotalContatos(totalClientes);
        setTotalPendencias(pendenciasCount);
        setVendasPorMes(listaVendasMes);
        setFunilEtapas(listaFunil);

      } catch (error) {
        console.error('Erro ao processar dados no Dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    carregarDadosDashboard();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>

      {loading ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-slate-600">
          Carregando informações do sistema...
        </div>
      ) : (
        <>
          {/* Cards Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm font-medium text-slate-500">Total em Vendas</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                R$ {totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm font-medium text-slate-500">Total em Despesas</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm font-medium text-slate-500">Número de Contatos</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{totalContatos}</p>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <p className="text-sm font-medium text-slate-500">Pendências</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{totalPendencias}</p>
            </div>
          </div>

          {/* Listas Detalhadas de Vendas por Mês e Funil */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Vendas por Mês</h2>
              {vendasPorMes.length === 0 ? (
                <p className="text-slate-500 text-sm">Nenhum registro de venda encontrado no histórico.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {vendasPorMes.map((item, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">{item.mes}</span>
                      <span className="text-sm font-bold text-slate-900">
                        R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Funil de Orçamentos</h2>
              {funilEtapas.every((f) => f.quantidade === 0) ? (
                <p className="text-slate-500 text-sm">Nenhum orçamento cadastrado no momento.</p>
              ) : (
                <div className="space-y-3">
                  {funilEtapas.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <span className="text-sm font-medium text-slate-700">{f.etapa}</span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                        {f.quantidade} {f.quantidade === 1 ? 'registro' : 'registros'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}