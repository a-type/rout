import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition';

export default {
  id: 'chess-arena',
  title: 'Chess Arena',
  versions: [v1],
  tags: ['strategy', 'multiplayer', 'competitive'],
  creators: [
    {
      name: 'Grant Forrest',
      role: 'Developer',
      url: 'https://rout.games',
    },
  ],
} satisfies GameModule;

export { v1 };
