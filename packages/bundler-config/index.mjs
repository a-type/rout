import { pluginUnoCss } from '@a-type/rsbuild-plugin-unocss';
import { getGameUiOrigin, idToFederationId } from '@long-game/common';
import unoConfig from '@long-game/uno-config';
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

  return defineConfig(({ command }) => {
    const federationConfig = createModuleFederationConfig({
      name: idToFederationId(game.id, game.version),
      manifest: true,
      dts: false,
      getPublicPath: `function() { return "${getGameUiOrigin(game.id, game.version, game.devPort, command !== 'build')}"; }`,
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
      plugins: [
        pluginReact(),
        pluginUnoCss({
          config: unoConfig(true),
        }),
      ],
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
      },
    };
  });
};
