import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition';

export default {
  id: 'territory',
  title: 'territory',
  versions: [v1],
  creators: [
    {
      name: 'Grant Forrest',
    },
  ],
  tags: ['competitive', 'strategy', 'board'],
} satisfies GameModule;

export { v1 };
