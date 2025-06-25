import type { GameModule } from '@long-game/game-definition';
import { cardDefinitions } from './v1/definitions/cardDefinition';
import { gameDefinition as v1 } from './v1/gameDefinition';
import * as boardHelpers from './v1/gameState/board';

export default {
  id: 'gudnak',
  title: 'gudnak',
  versions: [v1],
  creators: [
    {
      name: 'Zack Litzsinger',
      role: 'Programmer',
    },
  ],
  tags: ['card', 'strategy', 'board', 'competitive'],
  prerelease: true,
} satisfies GameModule;

export type { FighterCard, TacticCard } from './v1/definitions/cardDefinition';
export { boardHelpers, cardDefinitions, v1 };
