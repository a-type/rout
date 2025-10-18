import { pluginUnoCss } from '@a-type/rsbuild-plugin-unocss';
import { InjectManifest } from '@birchill/inject-manifest-plugin';
import {
  ModuleFederationPlugin,
  createModuleFederationConfig,
} from '@module-federation/enhanced/rspack';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'node:path';

const federationConfig = createModuleFederationConfig({
  name: 'long-game',
  manifest: true,
  dts: false,
  shareStrategy: 'loaded-first',
  shared: {
    react: { singleton: true, requiredVersion: '>19.0.0' },
    'react/': {},
    'react-dom': {
      singleton: true,
      requiredVersion: '>19.0.0',
    },
    'react-dom/': {},
    'react-markdown': {},
    '@a-type/ui': {
      singleton: true,
      requiredVersion: '>2.0.0',
    },
    '@long-game/game-client': {
      singleton: true,
      requiredVersion: '>0.0.0',
    },
    '@long-game/game-ui': { singleton: true, requiredVersion: '>0.0.0' },
  },
  experiments: {
    // asyncStartup: true,
    // optimization: {
    //   target: 'web',
    // },
  },
});

const unoStats = {
  invalidations: 0,
  rebuilds: 0,
  deliveries: 0,
};

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    pluginUnoCss({
      enableIncludeCommentCheck: (file) => {
        return file.includes(path.join('@a-type', 'ui', 'dist'));
      },
      // include tagging on monorepo dependencies is not set up
      // || file.includes('@long-game'),
      enableCacheExtractedCSS: (file) =>
        file.includes('@long-game') ? false : file.includes('node_modules'),

      events: {
        onCssGenerated: () => {
          unoStats.rebuilds++;
        },
        onCssInvalidated: () => {
          unoStats.invalidations++;
        },
        onCssResolved: () => {
          unoStats.deliveries++;
          console.log(`UnoCSS plugin stats:`);
          console.log(`  Invalidations: ${unoStats.invalidations}`);
          console.log(`  Rebuilds: ${unoStats.rebuilds}`);
          console.log(`  Deliveries: ${unoStats.deliveries}`);
        },
      },
    }),
    pluginReact(),
  ],
  resolve: {
    alias: {
      '@': './src',
    },
  },
  tools: {
    rspack: {
      plugins: [
        new InjectManifest({
          swDest: 'sw.js',
        }),
        new ModuleFederationPlugin(federationConfig),
      ],
      resolve: {
        conditionNames:
          command === 'build'
            ? ['production', 'import', 'module', 'browser', 'default']
            : ['development', 'import', 'module', 'browser', 'default'],
      },
      output: {
        chunkFilename: (assetInfo) => {
          // The service worker entrypoint needs to be fixed (i.e. not have a hash
          // appended).
          if (assetInfo.chunk?.name === 'sw') {
            return '[name].js';
          }
          return '[name].[contenthash].js';
        },
        uniqueName: 'long-game',
      },
      optimization: {
        realContentHash: true,
      },
      cache: false,
    },
  },
  server: {
    port: 3100,
  },
  html: {
    template: './index.html',
  },
  source: {
    entry: {
      index: './src/main.tsx',
    },
  },
  dev: {
    client: {
      host: 'localhost',
    },
    progressBar: true,
  },
}));
