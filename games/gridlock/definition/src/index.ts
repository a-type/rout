import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition.js';

export default {
  id: 'gridlock',
  title: 'Gridlock',
  versions: [v1],
  tags: [],
  creators: [],
  prerelease: true,
  devPort: 3308,
} satisfies GameModule;

export { v1 };
