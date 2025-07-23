/**
 * On startup, register all federated game modules
 */

import { idToFederationId } from '@long-game/common';
import { queryClient } from '@long-game/game-client';
import { GameDefinition } from '@long-game/game-definition';
import {
  loadRemote,
  registerRemotes,
} from '@module-federation/enhanced/runtime';
import { ComponentType, lazy } from 'react';
import { publicSdk } from './publicSdk.js';

const cache: Map<string, any> = new Map();

export function getFederatedGameComponent(
  gameId: string,
  version: string,
  componentName: 'definition',
): Promise<GameDefinition>;
export function getFederatedGameComponent(
  gameId: string,
  version: string,
  componentName: 'renderer' | 'chat',
): ComponentType<any>;
export function getFederatedGameComponent(
  gameId: string,
  version: string,
  componentName: 'renderer' | 'chat' | 'definition',
): Promise<GameDefinition> | ComponentType<any> {
  const majorVersion = version.split('.')[0];
  const federatedPath = `${idToFederationId(gameId)}/${majorVersion}/${componentName}`;
  if (cache.has(federatedPath)) {
    return cache.get(federatedPath)!;
  }
  if (componentName === 'definition') {
    const promise = loadRemote<{ default: GameDefinition }>(federatedPath).then(
      (mod) => mod?.default,
    ) as Promise<GameDefinition>;
    cache.set(federatedPath, promise);
    return promise;
  }
  if (componentName === 'renderer') {
    const promise = lazy(() =>
      loadRemote(federatedPath).then((m: any) => ({ default: m.Renderer })),
    );
    cache.set(federatedPath, promise);
    return promise;
  }
  if (componentName === 'chat') {
    const promise = lazy(() =>
      loadRemote(federatedPath).then((m: any) => ({ default: m.ChatMessage })),
    );
    cache.set(federatedPath, promise);
    return promise;
  }
  throw new Error(`Unknown component name: ${componentName}`);
}

async function registerFederatedGames() {
  const games = await queryClient.fetchQuery(publicSdk.getGames());
  registerRemotes(
    Object.entries(games).map(([id, meta]) => ({
      name: idToFederationId(id),
      entry: `${meta.url}/mf-manifest.json`,
    })),
  );
}

registerFederatedGames();
