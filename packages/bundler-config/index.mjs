import { idToFederationId } from '@long-game/common';
import unoConfig from '@long-game/uno-config';
import {
  createModuleFederationConfig,
  ModuleFederationPlugin,
} from '@module-federation/enhanced/rspack';
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { UnoCSSRspackPlugin } from '@unocss/webpack/rspack';
import * as fs from 'fs';
import { fileURLToPath, URL } from 'url';

export const gameRsbuildConfig = (game) => {
  if (!game || !game.id || !game.versions || !game.devPort) {
    throw new Error(
      'Invalid game configuration provided. Must have id, versions, and devPort defined.',
    );
  }
  // check that all federated module files exist
  game.versions.forEach(({ version }) => {
    const majorVersion = version.split('.')[0];
    const rendererPath = `./src/${majorVersion}/Renderer.tsx`;
    const chatPath = `./src/${majorVersion}/ChatMessage.tsx`;
    const definitionPath = `./src/${majorVersion}/definition.ts`;
    if (!fs.existsSync(rendererPath)) {
      throw new Error(
        `Renderer file not found: ${rendererPath}. Please create this file.`,
      );
    }
    if (!fs.existsSync(chatPath)) {
      throw new Error(
        `ChatMessage file not found: ${chatPath}. Please create this file.`,
      );
    }
    if (!fs.existsSync(definitionPath)) {
      throw new Error(
        `Definition file not found: ${definitionPath}. Please create this file.`,
      );
    }
  });

  return defineConfig(({ command }) => {
    const federationConfig = createModuleFederationConfig({
      name: idToFederationId(game.id),
      manifest: true,
      dts: false,
      getPublicPath:
        command === 'build'
          ? undefined // in prod, we serve federated modules from the same origin as the app
          : `function() { return "http://localhost:${game.devPort}/"; }`,
      exposes: game.versions.reduce((map, { version }) => {
        const majorVersion = version.split('.')[0];
        map[`./${majorVersion}/renderer`] =
          `./src/${majorVersion}/Renderer.tsx`;
        map[`./${majorVersion}/chat`] = `./src/${majorVersion}/ChatMessage.tsx`;
        map[`./${majorVersion}/definition`] =
          `./src/${majorVersion}/definition.ts`;
        return map;
      }, {}),
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
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
      },
      tools: {
        rspack: {
          plugins: [
            UnoCSSRspackPlugin(unoConfig(true)),
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
      },
      source: {
        entry: {
          // arbitrary
          index: './src/v1/Renderer.tsx',
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
        assetPrefix: `/game-modules/${idToFederationId(game.id)}/`,
      },
    };
  });
};
