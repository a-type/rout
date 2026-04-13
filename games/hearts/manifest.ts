import { GameModule } from '@long-game/game-definition';

export default {
  id: 'hearts',
  title: 'Hearts',
  versions: [{ version: 'v1', devUIPort: 3401, devAPIPort: 3501 }],
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
