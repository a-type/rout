import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition.js';

export default {
  id: 'scribble',
  title: 'Scribble',
  versions: [v1],
  creators: [
    {
      name: 'Grant Forrest',
    },
  ],
  tags: ['casual', 'collaborative', 'creative', 'drawing'],
  description: `Rout's take on the classic party game of Telephone Pictionary. Draw a sentence, describe a drawing, and pass it on to your friends!`,
  devPort: 3301,
} satisfies GameModule;

export { v1 };
