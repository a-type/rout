import numberGuess from '@long-game/game-number-guess-renderer';
import territory from '@long-game/game-territory-renderer';
import gudnak from '@long-game/game-gudnak-renderer';
import { ComponentType } from 'react';

export const renderers: Record<string, { [version: string]: ComponentType }> = {
  'number-guess': numberGuess,
  territory,
  gudnak,
};
