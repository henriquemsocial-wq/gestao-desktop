import JSZip from "jszip";
import { readTextFile, readFile, readDir, writeFile, exists, BaseDirectory } from "@tauri-apps/plugin-fs";
import { join } from '@tauri-apps/api/path';
const APP_FOLDER = "GestaoDesktopData";
const IMAGES_FOLDER = "images";

export async function exportarBackup(): Promise<string> {
  const zip = new JSZip();
  
  const hasAppDir = await exists(APP_FOLDER, { baseDir: BaseDirectory.AppLocalData });
  if (!hasAppDir) {
    throw new Error("Nenhum dado encontrado para exportar.");
  }

  // Adicionar arquivos JSON da raiz (CSV/JSON de dados)
  const entries = await readDir(APP_FOLDER, { baseDir: BaseDirectory.AppLocalData });
  for (const entry of entries) {
    if (entry.isFile && entry.name.endsWith('.json')) {
      const content = await readTextFile(`${APP_FOLDER}/${entry.name}`, { baseDir: BaseDirectory.AppLocalData });
      zip.file(entry.name, content);
    }
  }

  // Adicionar pasta de imagens se existir
  const imagesDirPath = await join(APP_FOLDER, IMAGES_FOLDER);
  const hasImagesDir = await exists(imagesDirPath, { baseDir: BaseDirectory.AppLocalData });
  
  if (hasImagesDir) {
    const imageEntries = await readDir(imagesDirPath, { baseDir: BaseDirectory.AppLocalData });
    const zipImagesFolder = zip.folder(IMAGES_FOLDER);
    
    if (zipImagesFolder) {
      for (const imgEntry of imageEntries) {
        if (imgEntry.isFile) {
          const imgPath = await join(APP_FOLDER, IMAGES_FOLDER, imgEntry.name);
          const imgData = await readFile(imgPath, { baseDir: BaseDirectory.AppLocalData });
          zipImagesFolder.file(imgEntry.name, imgData);
        }
      }
    }
  }

  // Gerar o arquivo ZIP em formato binário
  const content = await zip.generateAsync({ type: "uint8array" });
  return JSON.stringify(content);
}

export async function importarBackup(fileContent: Uint8Array): Promise<void> {
  const zip = await JSZip.loadAsync(fileContent);

  // Garantir que a pasta principal existe
  const hasAppDir = await exists(APP_FOLDER, { baseDir: BaseDirectory.AppLocalData });
  if (!hasAppDir) {
    // Se não existir, podemos apenas prosseguir gravando os arquivos
  }

  for (const [filename, file] of Object.entries(zip.files)) {
    if (file.dir) continue;

    if (filename.startsWith(IMAGES_FOLDER + '/')) {
      const imgData = await file.async("uint8array");
      const targetPath = await join(APP_FOLDER, filename);
      await writeFile(targetPath, imgData, { baseDir: BaseDirectory.AppLocalData });
    } else if (filename.endsWith('.json')) {
      const textData = await file.async("text");
      const targetPath = await join(APP_FOLDER, filename);
      // Convertendo texto para Uint8Array para usar o writeFile atualizado
      const encoder = new TextEncoder();
      await writeFile(targetPath, encoder.encode(textData), { baseDir: BaseDirectory.AppLocalData });
    }
  }
}
export async function createLocalBackup(): Promise<void> {
  try {
    await exportarBackup();
  } catch (error) {
    console.error("Erro ao criar backup local:", error);
  }
}