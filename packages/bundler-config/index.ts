import { ArborPlugin } from '@arbor-css/postcss';
import arborPreset from '@long-game/arbor-config';
import { idToFederationId } from '@long-game/common';
import { federation } from '@module-federation/vite';
import pluginReact from '@vitejs/plugin-react';
import path from 'node:path';
import typegpuPlugin from 'unplugin-typegpu/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import restart from 'vite-plugin-restart';
import tsconfigPaths from 'vite-tsconfig-paths';

const localPackages = [
  '@long-game/game-ui',
  '@long-game/common',
  '@long-game/game-client',
  '@long-game/game-definition',
];

const shareScope = 'default';

const shareConfig: any = Object.fromEntries(
  [
    'react',
    'react/',
    'react-dom',
    'react-dom/',
    '@a-type/ui',
    ...localPackages,
  ].map((pkg) => [
    pkg,
    {
      singleton: true as const,
      // force games not to import their own share deps - if we can't
      // get a shared dep from host, error immediately.
      import: false as const,
    },
  ]),
);

const restartConfig = {
  restart: localPackages.map((pkg) =>
    path.resolve(
      import.meta.dirname,
      `../${pkg.replace('@long-game/', '')}/dist/**/*`,
    ),
  ),
  glob: true,
};

const optimizeDepsConfig = {};

const buildConfig = {
  target: 'esnext' as const,
  sourcemap: true,
  cssMinify: 'esbuild' as const,
};

const cssConfig = {
  postcss: {
    plugins: [
      ArborPlugin({
        preset: arborPreset,
      }) as any,
    ],
  },
};

const resolveConfig = (command: string) => ({});

export const gameViteConfig = (game: {
  id: string;
  devPort: number;
  version: string;
}) => {
  if (!game || !game.id || !game.devPort) {
    throw new Error(
      'Invalid game configuration provided. Must have id and devPort defined.',
    );
  }

  const gameRegistryOrigin =
    process.env.GAME_REGISTRY_ORIGIN || 'http://localhost:3102';

  return defineConfig(({ command, mode }) => {
    const devMode = mode === 'test' || command !== 'build';
    // in dev, load assets straight from the rsbuild server. in prod, they're
    // proxied through the registry worker.
    const baseUrl = devMode
      ? `http://localhost:${game.devPort}/`
      : `${gameRegistryOrigin}/${game.id}/${game.version}/`;

    return {
      plugins: [
        pluginReact({
          // this points to the host app's origin!
          reactRefreshHost: `http://localhost:3100`,
        }),
        typegpuPlugin({}),
        federation({
          name: idToFederationId(game.id, game.version),
          manifest: true,
          dts: false,
          // getPublicPath: `function() { return "${baseUrl}"; }`,
          exposes: {
            './renderer': `./ui/Renderer.tsx`,
            './chat': `./ui/ChatMessage.tsx`,
            './definition': `./ui/definition.ts`,
          },
          shared: shareConfig,
          shareScope,
        }),
        restart(restartConfig),
      ],
      build: {
        ...buildConfig,
        outDir: 'dist-ui',
      },
      css: cssConfig,
      server: {
        port: game.devPort,
        strictPort: true,
        origin: baseUrl,
      },
      preview: {
        port: game.devPort,
        strictPort: true,
        origin: baseUrl,
      },
      resolve: resolveConfig(command),
      optimizeDeps: optimizeDepsConfig,
      envPrefix: 'PUBLIC',
      base: baseUrl,
    };
  });
};

export const appViteConfig = defineConfig(({ command }) => {
  // main host app federation is all runtime.

  return {
    plugins: [
      tsconfigPaths(),
      pluginReact(),
      typegpuPlugin({}),
      VitePWA({
        srcDir: 'src',
        filename: 'service-worker.ts',
        strategies: 'injectManifest',
        injectManifest: {
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB
        },
        workbox: {
          sourcemap: true,
        },
      }),
      restart(restartConfig),
    ],
    resolve: resolveConfig(command),
    css: cssConfig,
    server: {
      port: 3100,
      strictPort: true,
    },
    preview: {
      port: 3100,
      strictPort: true,
    },
    build: buildConfig,
    optimizeDeps: optimizeDepsConfig,
    envPrefix: 'PUBLIC',
  };
});
