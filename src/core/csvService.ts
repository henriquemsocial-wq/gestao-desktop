import Papa from 'papaparse';
import { readTextFile, writeTextFile, exists, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
// Nome da pasta principal que ficará nos "Documentos" do usuário
const APP_FOLDER = 'GestaoDesktopData';
const IMAGES_FOLDER = 'images';

/**
 * Garante que a estrutura de pastas (CSV e Imagens) exista no computador.
 * Executado sempre que o app inicia.
 */
export async function initializeFileSystem() {
  try {
    const hasAppFolder = await exists(APP_FOLDER, { baseDir: BaseDirectory.Document });
    if (!hasAppFolder) {
      await mkdir(APP_FOLDER, { baseDir: BaseDirectory.Document });
      await ensureCsvExists('orcamentos.csv', ['numero', 'cliente_id', 'data', 'status', 'total', 'itens', 'observacao']);
      await ensureCsvExists('financeiro.csv', ['id', 'tipo', 'descricao', 'valor', 'data_vencimento', 'categoria', 'forma_pagamento', 'recorrencia', 'cliente', 'status']);
    }


    const imagesPath = await join(APP_FOLDER, IMAGES_FOLDER);
    const hasImagesFolder = await exists(imagesPath, { baseDir: BaseDirectory.Document });
    if (!hasImagesFolder) {
      await mkdir(imagesPath, { baseDir: BaseDirectory.Document });
    }

    // Cria os arquivos CSV vazios com cabeçalhos se não existirem
    // NOTA: O produtos.csv agora tem as novas colunas (unidade_medida, receita, custo, etc)
    await ensureCsvExists('clientes.csv', ['id', 'nome', 'telefone', 'email', 'documento', 'data_cadastro']);
    await ensureCsvExists('produtos.csv', ['id', 'codigo_barras', 'nome', 'categoria', 'saldo', 'unidade_medida', 'receita', 'custo', 'margem', 'preco', 'fotos', 'documentos']);
    await ensureCsvExists('orcamentos.csv', ['numero', 'cliente_id', 'data', 'status', 'total', 'itens']);
    
    console.log('Sistema de arquivos inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar sistema de arquivos:', error);
  }
}

/**
 * Cria um arquivo CSV com os cabeçalhos caso ele ainda não exista.
 */
async function ensureCsvExists(filename: string, headers: string[]) {
  const filePath = await join(APP_FOLDER, filename);
  const fileExists = await exists(filePath, { baseDir: BaseDirectory.Document });
  
  if (!fileExists) {
    const emptyCsv = Papa.unparse([headers]);
    await writeTextFile(filePath, emptyCsv, { baseDir: BaseDirectory.Document });
  }
}

/**
 * Lê todos os registros de um arquivo CSV específico.
 */
export async function readCSV<T>(filename: string): Promise<T[]> {
  try {
    const filePath = await join(APP_FOLDER, filename);
    const csvContent = await readTextFile(filePath, { baseDir: BaseDirectory.Document });
    
    const result = Papa.parse<T>(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true, // Converte números automaticamente
    });
    
    return result.data;
  } catch (error) {
    console.error(`Erro ao ler ${filename}:`, error);
    return [];
  }
}

/**
 * Sobrescreve um arquivo CSV com a nova lista de dados.
 */
export async function writeCSV<T>(filename: string, data: T[]): Promise<boolean> {
  try {
    const filePath = await join(APP_FOLDER, filename);
    const csvContent = Papa.unparse(data);
    await writeTextFile(filePath, csvContent, { baseDir: BaseDirectory.Document });
    return true;
  } catch (error) {
    console.error(`Erro ao escrever ${filename}:`, error);
    return false;
  }
}

/**
 * REGRA CRÍTICA DO PDF: Nomenclatura padronizada de imagens.
 * Retorna o nome exato que o arquivo de imagem deve ter.
 */
export function getStandardImageName(module: 'cliente' | 'produto' | 'orcamento', identifier: string, extension: string = 'jpg'): string {
  // Remove espaços e caracteres especiais do identificador por segurança
  const safeIdentifier = identifier.replace(/[^a-zA-Z0-9_-]/g, '');
  
  switch (module) {
    case 'cliente':
      return `cliente_${safeIdentifier}.${extension}`; // Ex: cliente_0015.jpg
    case 'produto':
      return `produto_${safeIdentifier}.${extension}`; // Ex: produto_7891023.jpg
    case 'orcamento':
      return `orcamento_${safeIdentifier}.${extension}`; // Ex: orcamento_2026_042.jpg
    default:
      return `img_${safeIdentifier}.${extension}`;
  }
}