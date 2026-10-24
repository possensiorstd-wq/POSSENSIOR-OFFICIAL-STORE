import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  const possibleQrisPaths = [
    path.resolve(__dirname, 'src/image/QRIS MANUAL.jpeg'),
    path.resolve(__dirname, 'src/images/QRIS MANUAL.jpeg'),
    path.resolve(__dirname, 'src/assets/images/QRIS MANUAL.jpeg'),
    path.resolve(__dirname, 'src/assets/QRIS MANUAL.jpeg'),
    path.resolve(__dirname, 'src-image-QRIS MANUAL.jpeg'),
  ];
  const actualQrisPath = possibleQrisPaths.find(p => fs.existsSync(p)) || possibleQrisPaths[0];

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: '../image/QRIS MANUAL.jpeg', replacement: actualQrisPath },
        { find: '../assets/images/QRIS MANUAL.jpeg', replacement: actualQrisPath },
        { find: '@/image/QRIS MANUAL.jpeg', replacement: actualQrisPath },
        { find: '@/assets/images/QRIS MANUAL.jpeg', replacement: actualQrisPath },
        { find: '@', replacement: path.resolve(__dirname, '.') },
      ],
    },
    define: {
      'import.meta.env.VITE_SUPABASE_ANON': JSON.stringify(
        process.env.VITE_SUPABASE_ANON || process.env.VITE_SUPABASE_ANON_KEY || ''
      ),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON || ''
      ),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
        process.env.VITE_SUPABASE_URL || ''
      ),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
