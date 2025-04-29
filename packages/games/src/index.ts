import { GameModule } from '@long-game/game-definition';
import gudnak from '@long-game/game-gudnak-definition';
import numberGuess from '@long-game/game-number-guess-definition';
import scribble from '@long-game/game-scribble-definition';
import territory from '@long-game/game-territory-definition';

const games: Record<string, GameModule> = {
  [numberGuess.id]: numberGuess,
  [territory.id]: territory,
  [gudnak.id]: gudnak,
  [scribble.id]: scribble,
  // GENERATED - DO NOT REMOVE THIS LINE
};

export default games;

export const freeGames = ['scribble'];

for (const freeGame of freeGames) {
  if (!Object.keys(games).includes(freeGame)) {
    throw new Error(`Free game ${freeGame} not found in games list`);
  }
}
