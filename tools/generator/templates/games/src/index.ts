import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition';

export default {
  id: '{{name}}',
  title: '{{name}}',
  versions: [v1],
} satisfies GameModule;
