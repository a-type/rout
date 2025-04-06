import { GameModule } from '@long-game/game-definition';
import numberGuess from '@long-game/game-number-guess-definition';
import territory from '@long-game/game-territory-definition';

const games: Record<string, GameModule> = {
  [numberGuess.id]: numberGuess,
  [territory.id]: territory,
  // [scribble.id]: scribble, (not ready yet)
  // GENERATED - DO NOT REMOVE THIS LINE
};

export default games;
