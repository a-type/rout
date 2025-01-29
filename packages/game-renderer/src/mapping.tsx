import numberGuess from '@long-game/game-number-guess-renderer';
import territory from '@long-game/game-territory-renderer';
import { FC } from 'react';

export const renderers: Record<
  string,
  { [version: string]: FC<{ gameSessionId: string }> }
> = {
  'number-guess': numberGuess,
  territory,
};
