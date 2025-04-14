import { ComponentType, lazy, LazyExoticComponent } from 'react';

// these are defined statically since I think dynamic imports need to be
// static for bundler analysis?
const moduleMap = {
  numberGuess: {
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
};

const packageCache: Record<
  string,
  Promise<{ default: Record<string, ComponentType> }>
> = {};

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

const versionCache = new Map<
  string,
  Map<string, LazyExoticComponent<ComponentType>>
>();

export function getLazyGameRenderer(gameId: string, version: string) {
  let gameCache = versionCache.get(gameId);
  if (!gameCache) {
    gameCache = new Map();
    versionCache.set(gameId, gameCache);
  }

  if (gameCache.has(version)) {
    return gameCache.get(version)!;
  }

  console.debug('Lazy loading game renderer', gameId, version);
  const value = lazy<ComponentType>(async () => {
    const { default: versions } = await loadGameModule(gameId);
    if (!versions) {
      return {
        default: () => <>Game version {version} not found</>,
      };
    }

    const Client = (versions as Record<string, ComponentType>)[version];
    if (!Client) {
      return {
        default: () => <>Game version {version} not found</>,
      };
    }

    return { default: Client };
  });

  gameCache.set(version, value);
  return value;
}
