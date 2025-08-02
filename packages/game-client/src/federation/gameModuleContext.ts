import { GameDefinition } from '@long-game/game-definition';

export type GameModuleContext = {
  getGameDefinition(gameId: string, version: string): Promise<GameDefinition>;
  getGameLatestVersion(gameId: string): Promise<string>;
};
