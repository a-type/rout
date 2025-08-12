import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition.js';

export default {
  id: 'exquisite-fridge',
  title: 'Exquisite Fridge',
  description: `Our twist on a classic creative writing game. Use your fridge magnet words to craft unpredictable stories with your friends!`,
  versions: [v1],
  tags: ['creative', 'collaborative', 'casual'],
  creators: [
    {
      name: 'The Rout Team',
      url: 'https://rout.games',
    },
  ],
  prerelease: false,
  devPort: 3304,
  screenshots: [
    {
      file: 'screen1.png',
      alt: `A prompt from another player made of fridge magnet looking tiles reads, "stupid small frog guy has a podcast."
      The current player has responded with a new sentence made of their own tiles which says, "the critter impersonate serious politicians and drink."
      Many other word tiles are visible for use in future prompts.`,
    },
  ],
} satisfies GameModule;

export { v1 };
