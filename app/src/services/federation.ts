import { createInstance } from '@module-federation/enhanced/runtime';
import { RetryPlugin } from '@module-federation/retry-plugin';

export const federation = createInstance({
  name: 'long-game',
  remotes: [],
});

// shared libs
import * as UI from '@a-type/ui';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactJsxDev from 'react/jsx-dev-runtime';
import ReactJsx from 'react/jsx-runtime';

import * as Common from '@long-game/common';
import * as GameClient from '@long-game/game-client';
import * as GameDefinition from '@long-game/game-definition';
import * as GameUI from '@long-game/game-ui';
import * as Notifications from '@long-game/notifications';
import * as VisualComponents from '@long-game/visual-components';

const scope = 'default';
const internalPackageVersions = '0.0.1';

const sharedModulesForViteRemotes = {
  react: React,
  'react/jsx-runtime': ReactJsx,
  'react/jsx-dev-runtime': ReactJsxDev,
  'react-dom': ReactDOM,
  '@a-type/ui': UI,
  '@long-game/common': Common,
  '@long-game/game-client': GameClient,
  '@long-game/game-definition': GameDefinition,
  '@long-game/game-ui': GameUI,
  '@long-game/notifications': Notifications,
  '@long-game/visual-components': VisualComponents,
};

function seedViteModuleCacheShareEntries(
  modules: Record<string, unknown>,
): void {
  const g = globalThis as any;
  const moduleCache = (g.__mf_module_cache__ ??= {
    share: {},
    remote: {},
  });
  moduleCache.share ??= {};

  for (const [name, mod] of Object.entries(modules)) {
    moduleCache.share[name] = mod;
    moduleCache.share[`default:${name}`] = mod;
  }
}

federation.registerShared({
  react: {
    version: React.version,
    scope,
    lib: () => React,
    shareConfig: {
      singleton: true,
      requiredVersion: `^${React.version}`,
    },
  },
  'react/jsx-runtime': {
    version: React.version,
    scope,
    lib: () => ReactJsx,
    shareConfig: {
      singleton: true,
      requiredVersion: `^${React.version}`,
    },
  },
  'react/jsx-dev-runtime': {
    version: React.version,
    scope,
    lib: () => ReactJsxDev,
    shareConfig: {
      singleton: true,
      requiredVersion: `^${React.version}`,
    },
  },
  'react-dom': {
    version: ReactDOM.version,
    scope,
    lib: () => ReactDOM,
    shareConfig: {
      singleton: true,
      requiredVersion: `^${ReactDOM.version}`,
    },
  },
  '@a-type/ui': {
    version: '6.0.0',
    scope,
    lib: () => UI,
    shareConfig: {
      singleton: true,
      requiredVersion: '>=6.0.0',
    },
  },

  '@long-game/game-client': {
    version: internalPackageVersions,
    scope,
    lib: () => GameClient,
    strategy: 'loaded-first',
    shareConfig: {
      singleton: true,
      requiredVersion: internalPackageVersions,
    },
  },
  '@long-game/game-definition': {
    version: internalPackageVersions,
    scope,
    lib: () => GameDefinition,
    strategy: 'loaded-first',
    shareConfig: {
      singleton: true,
      requiredVersion: internalPackageVersions,
    },
  },
  '@long-game/game-ui': {
    version: internalPackageVersions,
    scope,
    lib: () => GameUI,
    strategy: 'loaded-first',
    shareConfig: {
      singleton: true,
      requiredVersion: internalPackageVersions,
    },
  },
  '@long-game/notifications': {
    version: internalPackageVersions,
    scope,
    lib: () => Notifications,
    strategy: 'loaded-first',
    shareConfig: {
      singleton: true,
      requiredVersion: internalPackageVersions,
    },
  },
  '@long-game/visual-components': {
    version: internalPackageVersions,
    scope,
    lib: () => VisualComponents,
    strategy: 'loaded-first',
    shareConfig: {
      singleton: true,
      requiredVersion: internalPackageVersions,
    },
  },
  '@long-game/common': {
    version: internalPackageVersions,
    scope,
    lib: () => Common,
    strategy: 'loaded-first',
    shareConfig: {
      singleton: true,
      requiredVersion: internalPackageVersions,
    },
  },
});

// Vite remote chunks read from __mf_module_cache__.share directly in prod.
// Seed exact keys with concrete module exports so remotes receive the module
// object shape they expect (instead of runtime metadata entries).
seedViteModuleCacheShareEntries(sharedModulesForViteRemotes);

federation.registerPlugins([
  RetryPlugin({
    retryTimes: 3,
    retryDelay: 300,
  }) as any,
]);

(window as any).MF = federation;
