import { LongGameError } from '@long-game/common';

export * from './errors.js';
export * from './gameDefinition.js';
export { GameRandom } from './random.js';
export type * from './rendering.js';
export * from './rounds.js';
export * from './stateCache.js';
export type * from './utilTypes.js';

export interface GameModule {
  id: string;
  /** IDs that should still route to the game */
  aliasIds?: string[];
  versions: { version: `v${string}`; devPort: number }[];
  title: string;
  description?: string;
  tags: string[];
  creators: { name: string; role?: string; url?: string }[];
  prerelease?: boolean;
  /** Names of image files in the /games/<gameId>/meta/screenshots folder */
  screenshots?: { file: string; alt: string; version?: `v${string}` }[];
}

export { emptyGameDefinition } from './empty.js';

export function normalizeGameVersion(version: string | number) {
  if (typeof version === 'number') {
    return `v${version}`;
  }
  if (typeof version === 'string') {
    if (!version.startsWith('v')) {
      return `v${version}`;
    }
    return version;
  }
}

export function getVersion(game: GameModule, version: string | number) {
  const found = game.versions.find(
    (v) => v.version === normalizeGameVersion(version),
  );
  if (!found) {
    throw new LongGameError(
      LongGameError.Code.BadRequest,
      `Version ${version} not found for game ${game.id}`,
    );
  }
  return found;
}

export function getLatestVersion(game: GameModule) {
  const latest = game.versions.at(-1);
  if (!latest) {
    throw new LongGameError(
      LongGameError.Code.BadRequest,
      `No versions found for game ${game.id}`,
    );
  }
  return latest;
}
