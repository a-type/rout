import { GameModule } from '@long-game/game-definition';
import numberGuess from '@long-game/game-number-guess';

const games: Record<string, GameModule> = {
  [numberGuess.id]: numberGuess,
  // GENERATED - DO NOT REMOVE THIS LINE
};

export default games;
