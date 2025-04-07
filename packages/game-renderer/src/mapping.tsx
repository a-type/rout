import numberGuess from '@long-game/game-number-guess-renderer';
import scribble from '@long-game/game-scribble-renderer';
import territory from '@long-game/game-territory-renderer';

import { ComponentType } from 'react';

export const renderers: Record<string, { [version: string]: ComponentType }> = {
  'number-guess': numberGuess,
  territory,
  scribble,
};
