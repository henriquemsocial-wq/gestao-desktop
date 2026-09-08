import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // Mantém as configurações de porta que o Tauri precisa
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },

  // Ajuste para evitar conflito com bibliotecas CommonJS/UMD
  optimizeDeps: {
    include: ['html-to-docx', 'jszip'],
  },
}));