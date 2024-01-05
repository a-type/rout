import { gameDefinition as numberGuess } from '@long-game/game-number-guess';
import { GameDefinition } from '@long-game/game-definition';

export const gameDefinitions: Record<string, GameDefinition> = {
  [numberGuess.id]: numberGuess,
};
