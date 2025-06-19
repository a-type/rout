import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition';

export default {
  id: 'chess-arena',
  title: 'chess-arena',
  versions: [v1],
  tags: [],
  creators: [],
} satisfies GameModule;

export { v1 };
