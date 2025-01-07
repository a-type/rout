import react from '@vitejs/plugin-react-swc';
import UnoCSS from 'unocss/vite';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [UnoCSS(), react()],
  optimizeDeps: {
    exclude: ['@a-type/ui', '@long-game/game-client'],
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
    port: 3100,
  },
  build: {
    sourcemap: true,
  },
}));
