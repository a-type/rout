import { GameModule } from '@long-game/game-definition';

export default {
  id: 'exquisite-fridge',
  title: 'Exquisite Fridge',
  description: `Our twist on a classic creative writing game. Use your fridge magnet words to craft unpredictable stories with your friends!`,
  versions: [{ version: 'v1', devUIPort: 3404, devAPIPort: 3504 }],
  tags: ['creative', 'collaborative', 'casual'],
  creators: [
    {
      name: 'The Rout Team',
      url: 'https://rout.games',
    },
  ],
  prerelease: false,
  screenshots: [
    {
      file: 'screen1.png',
      alt: `A prompt from another player made of fridge magnet looking tiles reads, "stupid small frog guy has a podcast."
      The current player has responded with a new sentence made of their own tiles which says, "the critter impersonate serious politicians and drink."
      Many other word tiles are visible for use in future prompts.`,
    },
  ],
} satisfies GameModule;
