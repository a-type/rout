import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition';

export default {
  id: 'wizard-ball',
  title: 'wizard-ball',
  versions: [v1],
  tags: [],
  creators: [
    {
      name: 'Zack',
    },
  ],
} satisfies GameModule;

export { v1 };

export * from './v1/gameTypes';
