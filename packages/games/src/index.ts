import territory from '@long-game/game-territory';
import { GameModule } from '@long-game/game-definition';
import numberGuess from '@long-game/game-number-guess';

const games: Record<string, GameModule> = {
  [numberGuess.id]: numberGuess,
  [territory.id]: territory,
  // GENERATED - DO NOT REMOVE THIS LINE
};

export default games;
