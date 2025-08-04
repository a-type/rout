/**
 * On startup, register all federated game modules
 */

import { checkForUpdate, skipWaiting } from '@/swRegister.js';
import { Box, Button, H2, Icon, P } from '@a-type/ui';
import { idToFederationId } from '@long-game/common';
import { GameModuleContext, queryClient } from '@long-game/game-client';
import {
  emptyGameDefinition,
  GameDefinition,
} from '@long-game/game-definition';
import { DefaultChatMessage } from '@long-game/game-ui';
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
  if (gameId === 'empty') {
    if (componentName === 'definition') {
      return Promise.resolve(emptyGameDefinition);
    }
    if (componentName === 'renderer') {
      return lazy(() =>
        Promise.resolve({
          default: MissingRenderer,
        }),
      );
    }
    if (componentName === 'chat') {
      return lazy(() =>
        Promise.resolve({
          default: DefaultChatMessage,
        }),
      );
    }
  }
  const majorVersion = version.split('.')[0];
  const federatedPath = `${idToFederationId(gameId)}/${majorVersion}/${componentName}`;
  if (cache.has(federatedPath)) {
    return cache.get(federatedPath)!;
  }
  if (componentName === 'definition') {
    const promise = loadRemote<{ default: GameDefinition }>(federatedPath)
      .then((mod) => mod?.default)
      .catch((err) => {
        console.error(err);
        return emptyGameDefinition;
      }) as Promise<GameDefinition>;
    cache.set(federatedPath, promise);
    return promise;
  }
  if (componentName === 'renderer') {
    const promise = lazy(() =>
      loadRemote(federatedPath)
        .then((m: any) => {
          console.debug('Loaded remote renderer for', gameId, version);
          return { default: m.Renderer };
        })
        .catch((err) => {
          console.error(err);
          return {
            default: MissingRenderer,
          };
        }),
    );
    cache.set(federatedPath, promise);
    return promise;
  }
  if (componentName === 'chat') {
    const promise = lazy(() =>
      loadRemote(federatedPath)
        .then((m: any) => ({ default: m.ChatMessage }))
        .catch((err) => {
          console.error(err);
          return {
            default: DefaultChatMessage,
          };
        }),
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

function MissingRenderer() {
  return (
    <Box gap col layout="center center" full>
      <Icon name="warning" size={64} />
      <H2>Game Not Found</H2>
      <P>We're having trouble loading this game.</P>
      {import.meta.env.DEV ? (
        <P>Make sure you're running the dev task for it.</P>
      ) : (
        <>
          <P>You could try reloading the app.</P>
          <Button
            onClick={async () => {
              await checkForUpdate();
              skipWaiting();
              window.location.reload();
            }}
          >
            Reload
          </Button>
        </>
      )}
    </Box>
  );
}

export const gameModules: GameModuleContext = {
  getGameDefinition: (gameId, version) =>
    getFederatedGameComponent(gameId, version, 'definition'),
  getGameLatestVersion: async (gameId) => {
    const data = await publicSdk.getGame.run({ id: gameId });
    if (!data) {
      throw new Error(`Game not found: ${gameId}`);
    }
    return data.latestVersion;
  },
};
