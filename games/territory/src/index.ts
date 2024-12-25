import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition.js';

export default {
  id: 'territory',
  title: 'territory',
  versions: [v1],
} satisfies GameModule;
