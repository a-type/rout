import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition';

export { speciesIcons } from './v1/speciesData';
export { perks } from './v1/perkData';
export * from './v1/attributes';
export { getInningInfo } from './v1/utils';

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
