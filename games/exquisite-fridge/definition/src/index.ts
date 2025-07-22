import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition.js';

export default {
  id: 'exquisite-fridge',
  title: 'Exquisite Fridge',
  versions: [v1],
  tags: [],
  creators: [],
  prerelease: true,
  devPort: 3304,
} satisfies GameModule;

export { v1 };
