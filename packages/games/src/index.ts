import scribble from '@long-game/game-scribble';
import numberGuess from '@long-game/game-number-guess';
import neuron from '@long-game/game-neuron';
import { GameModule } from '@long-game/game-definition';

const games: Record<string, GameModule> = {
  [numberGuess.id]: numberGuess,
  [neuron.id]: neuron,
  [scribble.id]: scribble,
  // GENERATED - DO NOT REMOVE THIS LINE
};

export default games;
