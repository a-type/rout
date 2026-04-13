import { LongGameError } from '@long-game/common';
import { GameModule } from '@long-game/game-definition';
import numberGuess from '@long-game/game-number-guess';

export const gamesById: Record<string, GameModule> = {
  [numberGuess.id]: numberGuess,
  // GENERATED - DO NOT REMOVE THIS LINE
};

export const allGames = Object.values(gamesById);

export function getGame(id: string): GameModule {
  const game = gamesById[id];
  if (!game) {
    for (const g of Object.values(gamesById)) {
      if (g.aliasIds?.includes(id)) {
        return g;
      }
    }
    throw new LongGameError(
      LongGameError.Code.NotFound,
      `Game with id ${id} not found`,
    );
  }
  return game;
}

export const freeGames = [numberGuess.id];

for (const freeGame of freeGames) {
  if (!getGame(freeGame)) {
    throw new LongGameError(
      LongGameError.Code.InternalServerError,
      `Free game ${freeGame} not found in games list`,
    );
  }
}
