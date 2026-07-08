import { ArborPlugin } from '@arbor-css/postcss';
import arborPreset from '@long-game/arbor-config';
import { idToFederationId } from '@long-game/common';
import {
  createModuleFederationConfig,
  ModuleFederationPlugin,
} from '@module-federation/enhanced/rspack';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import typegpuPlugin from 'unplugin-typegpu/rspack';

export const gameRsbuildConfig = (game) => {
  if (!game || !game.id || !game.devPort) {
    throw new Error(
      'Invalid game configuration provided. Must have id and devPort defined.',
    );
  }

  const gameRegistryOrigin =
    process.env.GAME_REGISTRY_ORIGIN || 'http://localhost:3102';

  return defineConfig(({ command, envMode }) => {
    const devMode = envMode === 'test' || command !== 'build';
    // in dev, load assets straight from the rsbuild server. in prod, they're
    // proxied through the registry worker.
    const baseUrl = devMode
      ? `http://localhost:${game.devPort}/`
      : `${gameRegistryOrigin}/${game.id}/${game.version}/`;
    const federationConfig = createModuleFederationConfig({
      name: idToFederationId(game.id, game.version),
      manifest: true,
      dts: false,
      getPublicPath: `function() { return "${baseUrl}"; }`,
      exposes: {
        './renderer': `./ui/Renderer.tsx`,
        './chat': `./ui/ChatMessage.tsx`,
        './definition': `./ui/definition.ts`,
      },
      shared: {
        react: { singleton: true, requiredVersion: '>19.0.0' },
        'react/': {},
        'react-dom': { singleton: true, requiredVersion: '>19.0.0' },
        'react-dom/': {},
        '@a-type/ui': { singleton: true, requiredVersion: '>5.0.0' },
        '@long-game/game-client': {
          singleton: true,
          requiredVersion: '>0.0.0',
        },
        '@long-game/game-ui': { singleton: true, requiredVersion: '>0.0.0' },
      },
      // experiments: {
      //   asyncStartup: true,
      // },
    });

    return {
      build: {
        target: 'esnext',
        sourcemap: true,
        minify: false,
      },
      plugins: [pluginReact()],
      tools: {
        rspack: {
          plugins: [
            typegpuPlugin({}),
            new ModuleFederationPlugin(federationConfig),
          ],
          resolve: {
            conditionNames:
              command === 'build'
                ? ['production', 'import', 'module', 'browser', 'default']
                : ['development', 'import', 'module', 'browser', 'default'],
          },
          optimization: {
            realContentHash: true,
          },
        },
        postcss: (_, { addPlugins }) => {
          addPlugins(
            ArborPlugin({
              preset: arborPreset,
            }),
          );
        },
      },
      server: {
        port: game.devPort,
        strictPort: true,
      },
      source: {
        entry: {
          // arbitrary
          index: './ui/Renderer.tsx',
        },
        tsconfigPath: './tsconfig.ui.json',
      },
      dev: {
        assetPrefix: `http://localhost:${game.devPort}/`,
        // hmr: true,
        liveReload: true,
        client: {
          port: game.devPort,
        },
      },
      output: {
        distPath: 'ui-dist',
        assetPrefix: baseUrl,
      },
    };
  });
};
