import numberGuess from '@long-game/game-number-guess';
import neuron from '@long-game/game-neuron';
import { GameModule } from '@long-game/game-definition';

const games: Record<string, GameModule> = {
  [numberGuess.id]: numberGuess,
  [neuron.id]: neuron,
  // GENERATED - DO NOT REMOVE THIS LINE
};

export default games;
