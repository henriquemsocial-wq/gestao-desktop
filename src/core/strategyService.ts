import { readTextFile, writeTextFile, exists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';

const APP_FOLDER = 'GestaoDesktopData';
const STRATEGY_FILE = 'estrategia_comercial.json';

export interface StrategyData {
  icp: {
    segmento: string;
    faturamentoMedio: string;
    tamanhoEmpresa: string;
    doresPrincipais: string;
  };
  personas: Array<{
    id: string;
    nome: string;
    cargo: string;
    desafios: string;
    objecoes: string;
  }>;
  pipeline: Array<{
    id: string;
    titulo: string;
    cliente: string;
    etapa: 'Lead' | 'Contato' | 'Proposta' | 'Fechado' | 'Perdido';
    valor: number;
  }>;
}

const defaultData: StrategyData = {
  icp: { segmento: '', faturamentoMedio: '', tamanhoEmpresa: '', doresPrincipais: '' },
  personas: [],
  pipeline: []
};

export async function loadStrategyData(): Promise<StrategyData> {
  try {
    const folderExists = await exists(APP_FOLDER, { baseDir: BaseDirectory.Document });
    if (!folderExists) return defaultData;

    const filePath = await join(APP_FOLDER, STRATEGY_FILE);
    const fileExists = await exists(filePath, { baseDir: BaseDirectory.Document });
    
    if (!fileExists) return defaultData;

    const content = await readTextFile(filePath, { baseDir: BaseDirectory.Document });
    return JSON.parse(content);
  } catch (error) {
    console.error('Erro ao carregar dados de estratégia:', error);
    return defaultData;
  }
}

export async function saveStrategyData(data: StrategyData): Promise<boolean> {
  try {
    const filePath = await join(APP_FOLDER, STRATEGY_FILE);
    await writeTextFile(filePath, JSON.stringify(data, null, 2), { baseDir: BaseDirectory.Document });
    return true;
  } catch (error) {
    console.error('Erro ao salvar dados de estratégia:', error);
    return false;
  }
}