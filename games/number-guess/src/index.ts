import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './gameDefinition.js';

export default {
  id: 'number-guess',
  title: 'Number Guess',
  versions: [v1],
} satisfies GameModule;
