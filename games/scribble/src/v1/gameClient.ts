import { gameDefinition } from './gameDefinition.js';
import { create } from '@long-game/game-client/client';

export const hooks = create(gameDefinition);
