import JSZip from 'jszip';
import { writeFile, BaseDirectory, mkdir } from '@tauri-apps/plugin-fs';

const APP_FOLDER = 'GestaoDesktopData';
const DOCS_SUBFOLDER = 'documentos';

async function garantirDiretorio() {
  await mkdir(APP_FOLDER, { baseDir: BaseDirectory.Document, recursive: true });
  const subpath = `${APP_FOLDER}/${DOCS_SUBFOLDER}`;
  await mkdir(subpath, { baseDir: BaseDirectory.Document, recursive: true });
  return subpath;
}

/**
 * Converte HTML e salva fisicamente como arquivo .docx binário real
 */
export async function salvarComoDocx(nomeArquivo: string, htmlContent: string) {
  const subpath = await garantirDiretorio();
  const filePath = `${subpath}/${nomeArquivo}`;

  // Carrega dinamicamente o módulo para evitar erro de inicialização no Vite
  const htmlToDocxModule = await import('html-to-docx');
  const HTMLtoDOCX = (htmlToDocxModule as any).default || htmlToDocxModule;

  // 1. Gera o documento Word
  const docxData = await HTMLtoDOCX(htmlContent, null, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true,
  });

  let uint8Array: Uint8Array;

  // 2. Trata a conversão binária para Blob ou Buffer
  if (docxData instanceof Blob) {
    const arrayBuffer = await docxData.arrayBuffer();
    uint8Array = new Uint8Array(arrayBuffer);
  } else {
    uint8Array = new Uint8Array(docxData);
  }

  // 3. Salva no sistema de arquivos do Tauri
  await writeFile(filePath, uint8Array, { baseDir: BaseDirectory.Document });
}

/**
 * Converte HTML e empacota fisicamente como arquivo .odt (OpenDocument) binário real
 */
export async function salvarComoOdt(nomeArquivo: string, htmlContent: string) {
  const subpath = await garantirDiretorio();
  const filePath = `${subpath}/${nomeArquivo}`;

  const zip = new JSZip();

  zip.file('mimetype', 'application/vnd.oasis.opendocument.text', { compression: 'STORE' });
  
  const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
  <manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
    <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
    <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  </manifest:manifest>`;
  zip.folder('META-INF')?.file('manifest.xml', manifestXml);

  const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
  <office:document-content 
    xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" 
    xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
    xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
    office:version="1.2">
    <office:body>
      <office:text>
        <text:p>${htmlContent.replace(/<[^>]+>/g, '')}</text:p>
      </office:text>
    </office:body>
  </office:document-content>`;
  zip.file('content.xml', contentXml);

  const odtBlob = await zip.generateAsync({ type: 'uint8array' });
  await writeFile(filePath, odtBlob, { baseDir: BaseDirectory.Document });
}