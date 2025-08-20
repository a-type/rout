import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition.js';

export default {
  id: 'heir-apparent',
  title: 'Heir Apparent',
  versions: [v1],
  tags: [],
  creators: [],
  prerelease: true,
  devPort: 3305,
} satisfies GameModule;

export { v1 };
