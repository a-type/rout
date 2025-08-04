import { GameDefinition } from './gameDefinition.js';

export * from './errors.js';
export * from './gameDefinition.js';
export { GameRandom } from './random.js';
export type * from './rendering.js';
export * from './rounds.js';
export * from './stateCache.js';
export type * from './utilTypes.js';

export interface GameModule {
  versions: GameDefinition<any, any, any, any, any, any>[];
  id: string;
  title: string;
  description?: string;
  tags: string[];
  creators: { name: string; role?: string; url?: string }[];
  prerelease?: boolean;
  /** Names of image files in the /games/<gameId>/screenshots folder */
  screenshots?: { file: string; alt: string }[];
  devPort: number;
}

export function getLatestVersion(game: GameModule): GameDefinition {
  return game.versions[game.versions.length - 1];
}

export { emptyGameDefinition } from './empty.js';
