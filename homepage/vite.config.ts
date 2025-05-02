import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
import UnoCSS from 'unocss/vite';
import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [UnoCSS(), react()],
  optimizeDeps: {
    exclude: ['@a-type/ui'],
    include: [
      'react/jsx-runtime',
      'react',
      'react-dom',
      'react-dom/client',
      '@a-type/ui > formik',
    ],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    conditions:
      mode === 'production'
        ? ['production', 'import', 'module', 'browser', 'default']
        : ['development', 'import', 'module', 'browser', 'default'],
  },
  server: {
    port: 3099,
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        privacy: resolve(import.meta.dirname, 'privacy.html'),
        tos: resolve(import.meta.dirname, 'tos.html'),
      },
    },
  },
}));
