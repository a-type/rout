import { gameDefinition as numberGuess } from '@long-game/game-number-guess';
import { gameDefinition as neuron } from '@long-game/game-neuron';
import { GameDefinition } from '@long-game/game-definition';

export const gameDefinitions: Record<string, GameDefinition> = {
  [numberGuess.id]: numberGuess,
  [neuron.id]: neuron,
};
