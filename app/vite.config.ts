import react from '@vitejs/plugin-react-swc';
import UnoCSS from 'unocss/vite';
import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    UnoCSS({
      content: {
        pipeline: {
          include: [/\.(ts|tsx)($|\?)/, /@long-game/],
        },
        filesystem: ['../packages/game-ui/src/**/*'],
      },
    }),
    react(),
  ],
  optimizeDeps: {
    exclude: ['@a-type/ui', '@long-game/game-client', '@long-game/game-ui'],
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
    proxy: {
      '/public-api': {
        target: 'http://localhost:3101',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/public-api/, ''),
      },
      '/game-session-api': {
        target: 'http://localhost:3102',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/game-session-api/, ''),
        ws: true,
      },
    },
  },
  build: {
    sourcemap: true,
  },
}));
