import { readTextFile, writeTextFile, exists, BaseDirectory } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';

const APP_FOLDER = 'GestaoDesktopData';
const FINANCE_FILE = 'transacoes_financeiras.json';

export interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string; // formato YYYY-MM-DD
  tipo: 'receber' | 'pagar';
  status: 'pendente' | 'pago';
  categoria: string;
}

export async function loadTransacoes(): Promise<Transacao[]> {
  try {
    const filePath = await join(APP_FOLDER, FINANCE_FILE);
    const fileExists = await exists(filePath, { baseDir: BaseDirectory.Document });
    if (!fileExists) return [];

    const content = await readTextFile(filePath, { baseDir: BaseDirectory.Document });
    return JSON.parse(content);
  } catch (error) {
    console.error('Erro ao carregar finanças:', error);
    return [];
  }
}

export async function saveTransacoes(transacoes: Transacao[]): Promise<boolean> {
  try {
    const filePath = await join(APP_FOLDER, FINANCE_FILE);
    await writeTextFile(filePath, JSON.stringify(transacoes, null, 2), { baseDir: BaseDirectory.Document });
    return true;
  } catch (error) {
    console.error('Erro ao salvar finanças:', error);
    return false;
  }
}