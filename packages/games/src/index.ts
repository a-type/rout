import { LongGameError } from '@long-game/common';
import { GameModule } from '@long-game/game-definition';
import exquisiteFridge from '@long-game/game-exquisite-fridge-definition';
import gridlock from '@long-game/game-garden-path-definition';
import hearts from '@long-game/game-hearts-definition';
import heirApparent from '@long-game/game-heir-apparent-definition';
import numberGuess from '@long-game/game-number-guess-definition';
import scribble from '@long-game/game-scribble-definition';
import wizardBall from '@long-game/game-wizard-ball-definition';

export const gamesById: Record<string, GameModule> = {
  [numberGuess.id]: numberGuess,
  [scribble.id]: scribble,
  [hearts.id]: hearts,
  [wizardBall.id]: wizardBall,
  [exquisiteFridge.id]: exquisiteFridge,
  [heirApparent.id]: heirApparent,
  [gridlock.id]: gridlock,
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

export const freeGames = [scribble.id, hearts.id, exquisiteFridge.id];

for (const freeGame of freeGames) {
  if (!getGame(freeGame)) {
    throw new LongGameError(
      LongGameError.Code.InternalServerError,
      `Free game ${freeGame} not found in games list`,
    );
  }
}
