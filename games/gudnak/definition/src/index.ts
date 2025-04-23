import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition';
import { cardDefinitions } from './v1/definitions/cardDefinition';
import * as boardHelpers from './v1/gameState/board';

export default {
  id: 'gudnak',
  title: 'gudnak',
  versions: [v1],
} satisfies GameModule;

export type { FighterCard, TacticCard } from './v1/definitions/cardDefinition';
export { v1, cardDefinitions, boardHelpers };
