// import { pluginUnoCss } from '@a-type/rsbuild-plugin-unocss';
import { InjectManifest } from '@aaroon/workbox-rspack-plugin';
import { createModuleFederationConfig } from '@module-federation/enhanced/rspack';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
// import path from 'node:path';

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
      requiredVersion: '>5.0.0',
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
export default defineConfig(({ command, envMode }) => ({
  plugins: [
    // pluginUnoCss({
    //   enableIncludeCommentCheck: (file) => {
    //     return file.includes(path.join('@a-type', 'ui', 'dist'));
    //   },
    //   // include tagging on monorepo dependencies is not set up
    //   // || file.includes('@long-game'),
    //   enableCacheExtractedCSS: (file) =>
    //     file.includes('@long-game') ? false : file.includes('node_modules'),

    //   events: {
    //     onCssGenerated: () => {
    //       unoStats.rebuilds++;
    //     },
    //     onCssInvalidated: () => {
    //       unoStats.invalidations++;
    //     },
    //     onCssResolved: () => {
    //       unoStats.deliveries++;
    //       console.log(`UnoCSS plugin stats:`);
    //       console.log(`  Invalidations: ${unoStats.invalidations}`);
    //       console.log(`  Rebuilds: ${unoStats.rebuilds}`);
    //       console.log(`  Deliveries: ${unoStats.deliveries}`);
    //     },
    //   },
    // }),
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
        envMode === 'production'
          ? new InjectManifest({
              swSrc: './src/service-worker.ts',
              injectionPoint: 'self.__WB_MANIFEST',
              swDest: 'service-worker.ts',
              maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
            })
          : undefined,
        // new ModuleFederationPlugin(federationConfig),
      ].filter(Boolean),
      // resolve: {
      //   conditionNames:
      //     command === 'build'
      //       ? ['production', 'import', 'module', 'browser', 'default']
      //       : ['development', 'import', 'module', 'browser', 'default'],
      // },
      output: {
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
  environments: {
    web: {
      source: {
        entry: {
          index: './src/main.tsx',
        },
      },
      output: {
        target: 'web' as const,
        distPath: {
          root: 'dist',
        },
      },
    },
    node: {
      output: {
        target: 'node' as const,
        distPath: {
          root: 'dist/server',
        },
      },
    },
  },
}));
