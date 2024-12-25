import { create } from '@long-game/game-client/client';
import { gameDefinition } from './gameDefinition.js';

export const {
  useCurrentTurn,
  usePriorRounds,
  usePlayerState,
  useChat,
  useCombinedLog,
  usePlayer,
  usePlayerId,
  usePlayers,
} = create(gameDefinition);
