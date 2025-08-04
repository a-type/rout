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
  screenshots: [
    {
      file: 'screen1.png',
      alt: `A player drafting three cards to pass to another player`,
    },
    {
      file: 'screen2.png',
      alt: `A player is about to play on a trick, the current card is the 2 of clubs`,
    },
  ],
} satisfies GameModule;

export { v1 };
