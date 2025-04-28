import type { GameRendererModule } from '@long-game/game-definition';
import { ComponentType, lazy, LazyExoticComponent } from 'react';

// these are defined statically since I think dynamic imports need to be
// static for bundler analysis?
const moduleMap = {
  ['number-guess']: {
    main: () => import('@long-game/game-number-guess-renderer'),
    css: () => import('@long-game/game-number-guess-renderer/css.css'),
  },
  territory: {
    main: () => import('@long-game/game-territory-renderer'),
    css: () => import('@long-game/game-territory-renderer/css.css'),
  },
  scribble: {
    main: () => import('@long-game/game-scribble-renderer'),
    css: () => import('@long-game/game-scribble-renderer/css.css'),
  },
  gudnak: {
    main: () => import('@long-game/game-gudnak-renderer'),
    css: () => import('@long-game/game-gudnak-renderer/css.css'),
  },
};

const packageCache: Record<string, Promise<GameRendererModule>> = {};

async function loadGameModule(gameId: string) {
  if (Object.keys(packageCache).includes(gameId)) {
    return packageCache[gameId];
  }
  const load = moduleMap[gameId as keyof typeof moduleMap];
  if (!load) {
    throw new Error(`Game ${gameId} not found`);
  }
  load.css();
  packageCache[gameId] = load.main();
  return packageCache[gameId];
}

async function getGameVersionModule(
  gameId: string,
  version: string,
): Promise<{
  Client: ComponentType<any>;
  Round: ComponentType<any>;
}> {
  const { default: versions } = await loadGameModule(gameId);
  if (!versions) {
    return {
      Client: () => <>Game version {version} not found</>,
      Round: () => <>Game version {version} not found</>,
    };
  }

  return versions[version];
}

const roundCache = new Map<
  string,
  Map<string, LazyExoticComponent<ComponentType>>
>();
export function getLazyRoundRenderer(gameId: string, version: string) {
  let gameCache = roundCache.get(gameId);
  if (!gameCache) {
    gameCache = new Map();
    roundCache.set(gameId, gameCache);
  }

  if (gameCache.has(version)) {
    return gameCache.get(version)!;
  }

  const value = lazy<ComponentType<any>>(async () => {
    const { Round } = await getGameVersionModule(gameId, version);
    return { default: Round };
  });

  gameCache.set(version, value);
  return value;
}

const rendererCache = new Map<
  string,
  Map<string, LazyExoticComponent<ComponentType>>
>();

export function getLazyGameRenderer(gameId: string, version: string) {
  let gameCache = rendererCache.get(gameId);
  if (!gameCache) {
    gameCache = new Map();
    rendererCache.set(gameId, gameCache);
  }

  if (gameCache.has(version)) {
    return gameCache.get(version)!;
  }

  const value = lazy<ComponentType>(async () => {
    const { Client } = await getGameVersionModule(gameId, version);
    return { default: Client };
  });

  gameCache.set(version, value);
  return value;
}
