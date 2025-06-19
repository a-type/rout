import chessArena from '@long-game/game-chess-arena-definition';
import { GameModule } from '@long-game/game-definition';
import gudnak from '@long-game/game-gudnak-definition';
import hearts from '@long-game/game-hearts-definition';
import numberGuess from '@long-game/game-number-guess-definition';
import scribble from '@long-game/game-scribble-definition';
import wizardBall from '@long-game/game-wizard-ball-definition';

const games: Record<string, GameModule> = {
  [numberGuess.id]: numberGuess,
  [gudnak.id]: gudnak,
  [scribble.id]: scribble,
  [hearts.id]: hearts,
  [wizardBall.id]: wizardBall,
  [chessArena.id]: chessArena,
  // GENERATED - DO NOT REMOVE THIS LINE
};

export default games;

export const freeGames = ['scribble'];

for (const freeGame of freeGames) {
  if (!Object.keys(games).includes(freeGame)) {
    throw new Error(`Free game ${freeGame} not found in games list`);
  }
}
