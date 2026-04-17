import { GameModule } from '@long-game/game-definition';

export default {
  id: 'scribble',
  title: 'Scribble',
  versions: [{ version: 'v1', devUIPort: 3402, devAPIPort: 3502 }],
  creators: [
    {
      name: 'Grant Forrest',
    },
  ],
  tags: ['casual', 'collaborative', 'creative', 'drawing'],
  description: `Rout's take on the classic party game of Telephone Pictionary. Draw a sentence, describe a drawing, and pass it on to your friends!`,
} satisfies GameModule;
