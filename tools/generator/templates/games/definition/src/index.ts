import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition';

export default {
  id: '{{name}}',
  title: '{{titleName}}',
  versions: [v1],
  tags: [],
  creators: [],
  prerelease: true,
} satisfies GameModule;

export { v1 };
