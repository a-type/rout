import { GameDefinition } from './gameDefinition.js';

export * from './gameDefinition.js';
export { GameRandom } from './random.js';
export type * from './rendering.js';
export { roundFormat } from './rounds.js';
export type * from './utilTypes.js';

export interface GameModule {
  versions: GameDefinition[];
  id: string;
  title: string;
  description?: string;
  tags: string[];
  creators: { name: string; role?: string; url?: string }[];
}

export function getLatestVersion(game: GameModule): GameDefinition {
  return game.versions[game.versions.length - 1];
}
