import { createGameClient } from '@long-game/game-client';
import { gameDefinition } from './gameDefinition.js';

export const { useGameClient, withGame } = createGameClient(gameDefinition);
