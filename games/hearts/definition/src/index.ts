import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition.js';

export default {
  id: 'hearts',
  title: 'Hearts',
  versions: [v1],
  tags: ['trick-taking', 'cards', 'classic', 'competitive'],
  description:
    'Hearts is a classic trick-taking game where players try to avoid taking certain cards that carry penalty points. The game is played with a standard deck of cards, and the objective is to have the lowest score at the end of the game.',
  creators: [
    {
      name: 'Rout',
      role: 'developer',
      url: 'https://rout.games',
    },
  ],
  devPort: 3302,
} satisfies GameModule;

export { v1 };
