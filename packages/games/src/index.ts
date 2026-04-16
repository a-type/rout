import { LongGameError } from '@long-game/common';
import { GameModule } from '@long-game/game-definition';
import exquisiteFridge from '@long-game/game-exquisite-fridge';
import gardenPath from '@long-game/game-garden-path';
import hearts from '@long-game/game-hearts';
import heirApparent from '@long-game/game-heir-apparent';
import numberGuess from '@long-game/game-number-guess';
import scribble from '@long-game/game-scribble';
import wizardBall from '@long-game/game-wizard-ball';

export const gamesById: Record<string, GameModule> = {
  [numberGuess.id]: numberGuess,
  [hearts.id]: hearts,
  [scribble.id]: scribble,
  [exquisiteFridge.id]: exquisiteFridge,
  [wizardBall.id]: wizardBall,
  [heirApparent.id]: heirApparent,
  [gardenPath.id]: gardenPath,
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

export { getVersion } from '@long-game/game-definition';
