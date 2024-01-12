import type { GameModule } from '@long-game/game-definition';
import { gameDefinition as v1 } from './v1/gameDefinition';

export default {
  id: 'nomad',
  title: 'nomad',
  versions: [v1],
} satisfies GameModule;
