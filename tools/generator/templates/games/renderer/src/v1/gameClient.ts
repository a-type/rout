import { typedHooks } from '@long-game/game-client';
import { gameDefinition } from '@long-game/game-{{name}}-definition/v1';

export const hooks = typedHooks<typeof gameDefinition>();
