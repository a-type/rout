import { createGameClient } from '@long-game/game-client';
import { gameDefinition } from './gameDefinition.js';

export const { GameClientProvider, useGameClient, withGame } =
  createGameClient(gameDefinition);
